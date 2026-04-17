#!/usr/bin/env bash
# run-codex-with-retry.sh v2
#
# Wrapper that runs `codex exec --json --dangerously-bypass-approvals-and-sandbox`
# and delegates retry decisions to check-codex-completion.sh. Retries ONLY on
# the FLAKE_DETECTED verdict (exit 12) — any other verdict (real error,
# link regression, deliverables missing, etc.) passes through untouched so
# the caller can investigate.
#
# Usage:
#   run-codex-with-retry.sh <prompt> <out.jsonl> [max_retries] \
#       [--delivery-marker STR] [--expect-path PATH]... [--link-grep-glob GLOB]...
#
# Default max_retries = 3.
#
# Exit codes mirror check-codex-completion.sh (so callers read one contract):
#   0   OK
#   2   usage error
#   10  EMPTY_JSONL (codex crashed immediately or prompt not delivered)
#   11  NO_DELIVERY_MARKER
#   12  FLAKE_EXHAUSTED (retries used up on flake)
#   13  REAL_ERROR
#   14  LINK_REGRESSION
#   15  DELIVERABLES_MISSING
#   16  NO_TURN_COMPLETED
#   other: codex's own non-zero exit (subprocess error)

set -u

PROMPT=""
OUT=""
MAX=3
CHECK_ARGS=()

# Parse positional args (first two) + forward everything else to the checker
while (( $# > 0 )); do
  case "$1" in
    --delivery-marker|--expect-path|--link-grep-glob|--report-file)
      CHECK_ARGS+=("$1" "$2"); shift 2 ;;
    -*)
      echo "run-codex-with-retry: unknown flag $1" >&2; exit 2 ;;
    *)
      if   [[ -z "$PROMPT" ]]; then PROMPT="$1"
      elif [[ -z "$OUT"    ]]; then OUT="$1"
      else MAX="$1"
      fi
      shift ;;
  esac
done

if [[ -z "$PROMPT" || -z "$OUT" ]]; then
  echo "usage: $0 <prompt> <out.jsonl> [max_retries] [--delivery-marker STR] [--expect-path PATH]... [--link-grep-glob GLOB]..." >&2
  exit 2
fi

if [[ ! -s "$PROMPT" ]]; then
  echo "run-codex-with-retry: prompt file missing or empty: $PROMPT" >&2
  exit 2
fi

CHECKER="$(dirname "$0")/check-codex-completion.sh"
if [[ ! -x "$CHECKER" ]]; then
  echo "run-codex-with-retry: checker not found or not executable at $CHECKER" >&2
  exit 2
fi

attempt=1
while (( attempt <= MAX )); do
  echo "run-codex-with-retry: attempt $attempt of $MAX ..." >&2

  # Run Codex synchronously
  codex exec --json --dangerously-bypass-approvals-and-sandbox - \
    < "$PROMPT" > "$OUT" 2>/dev/null
  codex_exit=$?

  if [[ $codex_exit -ne 0 ]]; then
    echo "run-codex-with-retry: codex itself exited $codex_exit; not a retriable flake" >&2
    exit $codex_exit
  fi

  # Delegate verdict to checker
  bash "$CHECKER" "$OUT" "${CHECK_ARGS[@]:-}"
  check_exit=$?

  echo "run-codex-with-retry: checker verdict exit=$check_exit on attempt $attempt" >&2

  # Retry only on flake; all other verdicts pass through
  if [[ $check_exit -eq 12 ]]; then
    if (( attempt < MAX )); then
      # Preserve the flaky attempt for audit
      cp "$OUT" "${OUT%.jsonl}.flake-attempt-${attempt}.jsonl"
      attempt=$((attempt + 1))
      sleep 2
      continue
    else
      echo "run-codex-with-retry: exhausted $MAX retries on flake; giving up" >&2
      exit 12
    fi
  fi

  # Any other verdict (0=OK, 13=real error, 14=link regression, 15=deliverables
  # missing, 16=no turn completed, 10/11=delivery failures) passes through.
  exit $check_exit
done

echo "run-codex-with-retry: unreachable; attempt loop exited without verdict" >&2
exit 99
