#!/usr/bin/env bash
# check-codex-completion.sh
#
# Ground-truth completion checker for a Codex run. Reads a JSONL transcript
# and optionally a list of expected on-disk paths; produces a verdict file
# and a specific exit code so callers don't need to re-derive the check.
#
# Usage:
#   check-codex-completion.sh <jsonl> [--delivery-marker STR] [--expect-path PATH]... \
#       [--link-grep-glob GLOB]... [--report-file PATH]
#
# Exit codes (stable contract — callers switch on these):
#   0   OK: prompt delivered, no flake, no real error, all expected paths exist, no link: regressions
#   10  EMPTY_JSONL: transcript is empty or missing (prompt likely never reached Codex)
#   11  NO_DELIVERY_MARKER: delivery marker missing from JSONL (prompt delivery failed)
#   12  FLAKE_DETECTED: one or more commands hit -1073741502 with empty output (STATUS_DLL_INIT_FAILED)
#                     — wrapper/caller should retry
#   13  REAL_ERROR: command failure with non-flake signature (don't retry, investigate)
#   14  LINK_REGRESSION: one or more package.json files contain "link:" deps (finding 001 catch)
#   15  DELIVERABLES_MISSING: one or more --expect-path entries absent on disk
#   16  NO_TURN_COMPLETED: Codex didn't finish a turn (crashed or killed mid-stream)
#
# The verdict file (default: <jsonl-stem>.completion-report.txt) contains a
# one-line summary + a detailed breakdown.
#
# Example:
#   check-codex-completion.sh out.jsonl \
#     --delivery-marker DELIVERY_CHECK_MARKER_ECHO_7077 \
#     --expect-path /c/github/myrepo/package.json \
#     --expect-path /c/github/myrepo/apps/panel/shared/src/errors/codes.ts \
#     --link-grep-glob '/c/github/myrepo/package.json' \
#     --link-grep-glob '/c/github/myrepo/apps/*/package.json'

set -u

JSONL=""
MARKER=""
EXPECT_PATHS=()
LINK_GLOBS=()
REPORT=""

while (( $# > 0 )); do
  case "$1" in
    --delivery-marker)  MARKER="$2"; shift 2 ;;
    --expect-path)      EXPECT_PATHS+=("$2"); shift 2 ;;
    --link-grep-glob)   LINK_GLOBS+=("$2"); shift 2 ;;
    --report-file)      REPORT="$2"; shift 2 ;;
    --)                 shift; break ;;
    -*)                 echo "check-codex-completion: unknown flag $1" >&2; exit 2 ;;
    *)                  if [[ -z "$JSONL" ]]; then JSONL="$1"; else echo "check-codex-completion: extra arg $1" >&2; exit 2; fi; shift ;;
  esac
done

if [[ -z "$JSONL" ]]; then
  echo "usage: $0 <jsonl> [--delivery-marker STR] [--expect-path PATH]... [--link-grep-glob GLOB]... [--report-file PATH]" >&2
  exit 2
fi

# Default report file next to the JSONL
if [[ -z "$REPORT" ]]; then
  REPORT="${JSONL%.jsonl}.completion-report.txt"
fi

# ---- helpers ----

write_report() {
  local verdict="$1"; shift
  {
    echo "verdict: $verdict"
    echo "jsonl: $JSONL"
    echo "checked_at: $(date -Iseconds 2>/dev/null || date)"
    echo ""
    for line in "$@"; do echo "$line"; done
  } > "$REPORT"
}

# ---- gate 1: JSONL exists and is non-empty ----

if [[ ! -s "$JSONL" ]]; then
  write_report "EMPTY_JSONL" \
    "transcript is empty or missing: $JSONL" \
    "likely cause: prompt file never reached Codex (common: /tmp/ path divergence on Windows — finding 004)"
  echo "EMPTY_JSONL" >&2
  exit 10
fi

# ---- gate 2: turn.completed event present ----
# If no turn.completed, Codex crashed or was killed mid-stream. This is a real
# infra issue (not a flake), but callers may still want to retry.

turn_completed=$(grep -c '"type":"turn.completed"' "$JSONL" 2>/dev/null || echo 0)
turn_completed=$(echo "$turn_completed" | tr -d '[:space:]')

# ---- gate 3: delivery marker present (if requested) ----

delivery_ok=yes
if [[ -n "$MARKER" ]]; then
  if ! grep -q "$MARKER" "$JSONL"; then
    delivery_ok=no
  fi
fi

# ---- gate 4: classify commands (flake vs real error vs success) ----
# The flake signature: exit_code -1073741502 with empty aggregated_output.
# A real error: any non-zero exit that isn't the flake signature.

# Pull each command_execution's exit_code. We do this via a small Python block
# for reliability (JSONL has nested quoting that awk/grep handle poorly).

classify_py=$(python3 -c "
import json, sys
flakes = 0
real_errs = 0
successes = 0
with open(sys.argv[1]) as f:
    for line in f:
        try: obj = json.loads(line)
        except: continue
        if obj.get('type') != 'item.completed': continue
        item = obj.get('item', {})
        if item.get('type') != 'command_execution': continue
        exit_code = item.get('exit_code')
        output = item.get('aggregated_output', '')
        if exit_code == -1073741502 and not output.strip():
            flakes += 1
        elif exit_code != 0 and exit_code is not None:
            real_errs += 1
        elif exit_code == 0:
            successes += 1
print(f'{flakes} {real_errs} {successes}')
" "$JSONL" 2>/dev/null)

if [[ -z "$classify_py" ]]; then
  # python3 unavailable; fall back to bash heuristic that's less precise
  # (will still catch flake but won't differentiate empty-output correctly)
  flakes=$(grep -oE '"exit_code":-1073741502' "$JSONL" 2>/dev/null | wc -l)
  real_errs=$(grep -oE '"exit_code":-?[0-9]+' "$JSONL" 2>/dev/null \
    | grep -vE '"exit_code":(0|-1073741502)' | wc -l)
  successes=$(grep -oE '"exit_code":0' "$JSONL" 2>/dev/null | wc -l)
else
  read -r flakes real_errs successes <<< "$classify_py"
fi
flakes=$(echo "$flakes" | tr -d '[:space:]')
real_errs=$(echo "$real_errs" | tr -d '[:space:]')
successes=$(echo "$successes" | tr -d '[:space:]')

# ---- gate 5: expected paths present on disk ----

missing_paths=()
for p in "${EXPECT_PATHS[@]:-}"; do
  [[ -z "$p" ]] && continue
  if [[ ! -e "$p" ]]; then
    missing_paths+=("$p")
  fi
done

# ---- gate 6: link-regression check ----

link_hits=()
for g in "${LINK_GLOBS[@]:-}"; do
  [[ -z "$g" ]] && continue
  # Shell glob expansion
  for f in $g; do
    if [[ -f "$f" ]]; then
      if grep -l '"link:' "$f" >/dev/null 2>&1; then
        link_hits+=("$f")
      fi
    fi
  done
done

# ---- composite verdict ----

details=(
  "turn_completed: $turn_completed"
  "delivery_marker: ${MARKER:-<none requested>} -> $delivery_ok"
  "commands: successes=$successes  flakes=$flakes  real_errs=$real_errs"
  "missing_paths: ${#missing_paths[@]} ${missing_paths[*]:-}"
  "link_regressions: ${#link_hits[@]} ${link_hits[*]:-}"
)

# Order matters — we surface the most fundamental failure first
if [[ "$turn_completed" == "0" ]]; then
  write_report "NO_TURN_COMPLETED" "${details[@]}" \
    "likely cause: Codex crashed or was killed before completing a turn"
  echo "NO_TURN_COMPLETED" >&2
  exit 16
fi

if [[ -n "$MARKER" && "$delivery_ok" == "no" ]]; then
  write_report "NO_DELIVERY_MARKER" "${details[@]}" \
    "likely cause: prompt was not delivered or Codex skipped the delivery-check echo"
  echo "NO_DELIVERY_MARKER" >&2
  exit 11
fi

# Real errors beat flakes in priority — if Codex had a real failure alongside
# a flake, caller should investigate the real failure, not retry the flake
if (( real_errs > 0 )); then
  write_report "REAL_ERROR" "${details[@]}" \
    "one or more commands failed with non-flake exit codes — investigate before retrying"
  echo "REAL_ERROR" >&2
  exit 13
fi

if (( flakes > 0 )); then
  write_report "FLAKE_DETECTED" "${details[@]}" \
    "$flakes command(s) hit STATUS_DLL_INIT_FAILED — wrapper/caller should retry the whole session"
  echo "FLAKE_DETECTED" >&2
  exit 12
fi

if (( ${#link_hits[@]} > 0 )); then
  write_report "LINK_REGRESSION" "${details[@]}" \
    "one or more package.json files contain link: deps — finding 001 catch — reject immediately"
  echo "LINK_REGRESSION" >&2
  exit 14
fi

if (( ${#missing_paths[@]} > 0 )); then
  write_report "DELIVERABLES_MISSING" "${details[@]}" \
    "Codex reported completion but expected on-disk artifacts are absent"
  echo "DELIVERABLES_MISSING" >&2
  exit 15
fi

write_report "OK" "${details[@]}" \
  "all gates passed — prompt delivered, no flake, no real error, all expected paths present, no link regressions"
echo "OK" >&2
exit 0
