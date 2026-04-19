#!/usr/bin/env bash
# drive-until-green.sh
#
# Canonical outer driver for a Codex implementation session on this project.
# Wraps `run-codex-with-retry.sh` (which handles process-level flake/wall retry)
# with an outer loop that keeps running Codex until the project's gates exit 0
# OR a non-routine failure is hit.
#
# Closes the two Story-1-era gaps that forced orchestrator intervention:
#   1. Codex-ends-with-unfixed-gate-errors: driver runs ground-truth gates after
#      every Codex exit. If gates fail but there are no flakes/walls/etc., it
#      composes a fix-list prompt from the gate output and launches a fresh exec.
#   2. Implementer-forgets-to-report: driver writes a structured §Step 6 report
#      that the teammate relays verbatim via SendMessage (no composition needed).
#
# Usage:
#   drive-until-green.sh <initial-prompt> <jsonl-stem> [--max-iterations N]
#                        [--gate "cmd1 && cmd2"]
#                        [--delivery-marker STR]
#                        [--expect-path PATH]... [--link-grep-glob GLOB]...
#
# jsonl-stem: a file path like "C:/Users/dsavi/AppData/Local/Temp/codex-story-1-impl"
#             — the driver appends .jsonl / .iter-N.jsonl / .impl-report.md to it.
#
# Exit codes:
#   0   DONE — gates green; report at <stem>.impl-report.md
#   20  MAX_ITERATIONS_EXHAUSTED — gates still red after N iterations
#   30  NON_ROUTINE_FAILURE — wrapper returned a non-retriable verdict (walled
#                             3×, missing delivery marker, link regression, etc.)
#                             Escalate to orchestrator — do not retry blindly.
#   40  INTERNAL — bad args / missing scripts
#
# This script is the ONLY thing the implementer teammate should run. It holds
# all the decisions (retry / iterate / escalate) so the teammate doesn't have
# to make them.

set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
WRAPPER="$HERE/run-codex-with-retry.sh"
CHECKER="$HERE/check-codex-completion.sh"
ENV_RULES="$HERE/env-rules.txt"

# Defaults — override via flags
MAX_ITERATIONS=4            # per-driver outer iterations (fix-rounds)
GATE_CMD="pnpm red-verify && pnpm verify"
MARKER="DELIVERY_CHECK_MARKER_ECHO_7077"
EXPECT_PATHS=()
LINK_GLOBS=()

INITIAL_PROMPT=""
STEM=""

while (( $# > 0 )); do
  case "$1" in
    --max-iterations) MAX_ITERATIONS="$2"; shift 2 ;;
    --gate)           GATE_CMD="$2"; shift 2 ;;
    --delivery-marker) MARKER="$2"; shift 2 ;;
    --expect-path)    EXPECT_PATHS+=("$2"); shift 2 ;;
    --link-grep-glob) LINK_GLOBS+=("$2"); shift 2 ;;
    -*)               echo "drive-until-green: unknown flag $1" >&2; exit 40 ;;
    *)
      if [[ -z "$INITIAL_PROMPT" ]]; then INITIAL_PROMPT="$1"
      elif [[ -z "$STEM" ]]; then STEM="$1"
      else echo "drive-until-green: extra arg $1" >&2; exit 40
      fi
      shift ;;
  esac
done

if [[ -z "$INITIAL_PROMPT" || -z "$STEM" ]]; then
  cat >&2 <<EOF
usage: $0 <initial-prompt> <jsonl-stem> [--max-iterations N] [--gate CMD]
          [--delivery-marker STR] [--expect-path PATH]... [--link-grep-glob GLOB]...
EOF
  exit 40
fi

for s in "$WRAPPER" "$CHECKER"; do
  if [[ ! -x "$s" ]]; then
    echo "drive-until-green: missing executable $s" >&2; exit 40
  fi
done
if [[ ! -s "$ENV_RULES" ]]; then
  echo "drive-until-green: missing env-rules file $ENV_RULES" >&2; exit 40
fi

# Build the checker-arg array (passed through to run-codex-with-retry.sh)
CHECK_ARGS=(--delivery-marker "$MARKER")
for p in "${EXPECT_PATHS[@]:-}"; do [[ -n "$p" ]] && CHECK_ARGS+=(--expect-path "$p"); done
for g in "${LINK_GLOBS[@]:-}"; do  [[ -n "$g" ]] && CHECK_ARGS+=(--link-grep-glob "$g"); done

PROMPT_FILE="$INITIAL_PROMPT"
REPORT="$STEM.impl-report.md"
ITER_LOG="$STEM.driver-log.txt"
: > "$ITER_LOG"

log() { echo "[drive] $*" | tee -a "$ITER_LOG" >&2; }

# Clean up stale Codex processes to avoid accumulation across iterations.
# (Fresh process for every iteration; prevents walled-session state leaking.)
cleanup_codex_procs() {
  if command -v tasklist >/dev/null 2>&1; then
    local n
    n=$(tasklist //FI "IMAGENAME eq codex.exe" 2>/dev/null | grep -c -i "codex.exe" || true)
    if (( n > 1 )); then
      log "killing $n stale Codex.exe processes before next iteration"
      taskkill //F //IM codex.exe >/dev/null 2>&1 || true
    fi
  fi
}

# After a non-green gate run, compose a fix prompt from the stored gate output.
compose_fix_prompt() {
  local iter="$1" gate_output_file="$2" out_prompt="$3"
  local prev_jsonl="$STEM.iter-$((iter-1)).jsonl"
  {
    echo "FIRST THING: echo $MARKER before anything else."
    echo ""
    cat "$ENV_RULES"
    echo ""
    echo "=== TASK (fix-round $iter) ==="
    echo ""
    echo "Your previous Codex session wrote implementation files for this story."
    echo "The project's acceptance gate is currently RED. Fix the specific errors"
    echo "below. Do NOT add new features. Do NOT rewrite files wholesale. Minimal"
    echo "surgical fixes only. After fixing, run the gate yourself and report"
    echo "exit codes."
    echo ""
    echo "Previous Codex JSONL (for context, do not re-read unless necessary):"
    echo "  $prev_jsonl"
    echo ""
    echo "=== GATE OUTPUT (most recent run from caller bash) ==="
    echo ""
    echo '```'
    # Limit to last 200 lines to keep prompt reasonable
    tail -n 200 "$gate_output_file"
    echo '```'
    echo ""
    echo "=== ACCEPTANCE ==="
    echo ""
    echo "Run the following in order. Both must exit 0 before you declare done:"
    echo "  $GATE_CMD"
    echo ""
    echo "If a fix requires adding a dependency, use the project's pnpm binary"
    echo "directly (see rule 2 above). If an error can't be fixed with a minimal"
    echo "local change, STOP and report — do NOT restructure the codebase."
  } > "$out_prompt"
}

# Run the project's gate from the caller's bash and capture output.
run_gate() {
  local out_file="$1"
  log "running project gate: $GATE_CMD"
  (cd "$(pwd)" && eval "$GATE_CMD") > "$out_file" 2>&1
  echo $?
}

# Main loop
iter=1
final_verdict="UNKNOWN"
gate_output_file=""

while (( iter <= MAX_ITERATIONS )); do
  log "=== iteration $iter of $MAX_ITERATIONS ==="
  cleanup_codex_procs

  ITER_JSONL="$STEM.iter-$iter.jsonl"
  log "launching codex via $WRAPPER"
  log "  prompt: $PROMPT_FILE"
  log "  jsonl:  $ITER_JSONL"

  bash "$WRAPPER" "$PROMPT_FILE" "$ITER_JSONL" 3 "${CHECK_ARGS[@]}"
  wrapper_exit=$?

  log "wrapper exit: $wrapper_exit"

  # Non-retriable wrapper verdicts → escalate immediately
  case "$wrapper_exit" in
    0)
      # Codex's own checker says "OK" — good signal, but we still ground-truth
      # the gates below before declaring done.
      ;;
    12)
      log "FLAKE_EXHAUSTED — wrapper retried 3× and every attempt was walled"
      final_verdict="WALLED_3X"
      break
      ;;
    11)
      log "NO_DELIVERY_MARKER — prompt didn't land; investigate /tmp path"
      final_verdict="NO_DELIVERY_MARKER"
      break
      ;;
    14)
      log "LINK_REGRESSION — package.json has link: deps; Story-0-class failure"
      final_verdict="LINK_REGRESSION"
      break
      ;;
    10|16)
      log "EMPTY_JSONL or NO_TURN_COMPLETED — Codex crashed; escalate"
      final_verdict="CODEX_CRASHED"
      break
      ;;
    13|15)
      # REAL_ERROR or DELIVERABLES_MISSING — Codex had intermediate failures.
      # Normally we'd escalate, but we now check ground-truth gates first:
      # Codex may have FIXED the errors in-session, and the gates might be green.
      log "wrapper verdict $wrapper_exit (REAL_ERROR or DELIVERABLES_MISSING) — checking ground-truth gates before escalating"
      ;;
    *)
      log "wrapper exit $wrapper_exit — unknown; escalating"
      final_verdict="UNKNOWN_WRAPPER_EXIT_$wrapper_exit"
      break
      ;;
  esac

  # Ground-truth gate check (THIS is the authoritative final-state signal)
  gate_output_file="$STEM.gate-output.iter-$iter.log"
  gate_exit=$(run_gate "$gate_output_file")
  log "gate exit: $gate_exit (output: $gate_output_file)"

  if [[ "$gate_exit" == "0" ]]; then
    log "GATES GREEN — done"
    final_verdict="GREEN"
    break
  fi

  # Gates red. If we hit MAX, escalate. Otherwise, compose fix prompt + iterate.
  if (( iter >= MAX_ITERATIONS )); then
    log "gates still red after $MAX_ITERATIONS iterations — escalating"
    final_verdict="MAX_ITERATIONS_EXHAUSTED"
    break
  fi

  NEXT_PROMPT="$STEM.fix-prompt.iter-$((iter+1)).md"
  compose_fix_prompt "$((iter+1))" "$gate_output_file" "$NEXT_PROMPT"
  log "composed fix prompt for next iteration: $NEXT_PROMPT"
  PROMPT_FILE="$NEXT_PROMPT"
  iter=$((iter + 1))
done

# Emit a structured §Step 6 report regardless of outcome.
# (If green, teammate relays; if escalated, orchestrator reads for triage.)
log "composing final report: $REPORT"

write_report() {
  {
    echo "# Story Implementation Report — Driver Output"
    echo ""
    echo "**Verdict:** $final_verdict"
    echo "**Iterations used:** $iter of $MAX_ITERATIONS"
    echo "**Final gate exit:** ${gate_exit:-<not-run>}"
    echo ""
    echo "## CLI Evidence"
    echo ""
    for ((i=1; i<=iter && i<=MAX_ITERATIONS; i++)); do
      local jsonl="$STEM.iter-$i.jsonl"
      if [[ -s "$jsonl" ]]; then
        local tid
        tid=$(head -1 "$jsonl" | grep -oE '"thread_id":"[^"]+"' | head -1 | cut -d'"' -f4)
        echo "- iter $i thread: \`${tid:-<unknown>}\`"
        echo "  - JSONL: \`$jsonl\`"
        local crep="$STEM.iter-$i.completion-report.txt"
        [[ -s "$crep" ]] && echo "  - wrapper verdict: $(grep -m1 '^verdict:' "$crep" | cut -d' ' -f2-)"
      fi
    done
    echo ""
    # Flake attempts (preserved by wrapper as <stem>.flake-attempt-N.jsonl)
    local flakes
    flakes=$(ls "$STEM".flake-attempt-*.jsonl 2>/dev/null | wc -l || true)
    flakes=$(echo "$flakes" | tr -d '[:space:]')
    echo "- Flake/walled attempts preserved: $flakes"
    echo ""
    echo "## Ground-truth Gate Run"
    echo ""
    echo '```'
    if [[ -s "${gate_output_file:-}" ]]; then
      tail -n 50 "$gate_output_file"
    else
      echo "(no gate output captured)"
    fi
    echo '```'
    echo ""
    echo "## Driver Log"
    echo ""
    echo '```'
    cat "$ITER_LOG" 2>/dev/null || echo "(none)"
    echo '```'
    echo ""
    echo "---"
    echo ""
    case "$final_verdict" in
      GREEN)
        echo "**Action:** Relay this report to team-lead via SendMessage. Story is implementation-complete; ready for reviewer phase."
        ;;
      MAX_ITERATIONS_EXHAUSTED)
        echo "**Action:** Escalate to team-lead. Gates still red after $MAX_ITERATIONS iterations; routine fixes exhausted. Human judgment needed on scope/approach."
        ;;
      WALLED_3X)
        echo "**Action:** Escalate. Every attempt (including 3 wrapper relaunches) hit a session-wall; this is beyond finding 009's documented pattern. Consider a machine reboot, or wait out any transient Windows state."
        ;;
      *)
        echo "**Action:** Escalate to team-lead with verdict \`$final_verdict\`."
        ;;
    esac
  } > "$REPORT"
}

write_report

case "$final_verdict" in
  GREEN)                    exit 0 ;;
  MAX_ITERATIONS_EXHAUSTED) exit 20 ;;
  *)                        exit 30 ;;
esac
