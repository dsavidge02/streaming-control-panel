#!/usr/bin/env bash
# compose-prompt.sh
#
# Assemble a Codex prompt from three parts:
#   1. The mandatory delivery marker line
#   2. The canonical env-rules block (shared across all prompts)
#   3. A story-specific task section (passed in as a file)
#
# Ensures every prompt follows the harness contract without copy-paste errors.
#
# Usage:
#   compose-prompt.sh <task-section-file> <output-prompt-file>
#                     [--marker STR]
#
# Defaults: marker=DELIVERY_CHECK_MARKER_ECHO_7077

set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ENV_RULES="$HERE/env-rules.txt"

MARKER="DELIVERY_CHECK_MARKER_ECHO_7077"
TASK=""
OUT=""

while (( $# > 0 )); do
  case "$1" in
    --marker) MARKER="$2"; shift 2 ;;
    -*)       echo "compose-prompt: unknown flag $1" >&2; exit 2 ;;
    *)        if [[ -z "$TASK" ]]; then TASK="$1"
              elif [[ -z "$OUT" ]]; then OUT="$1"
              else echo "compose-prompt: extra arg $1" >&2; exit 2
              fi
              shift ;;
  esac
done

if [[ -z "$TASK" || -z "$OUT" ]]; then
  echo "usage: $0 <task-section-file> <output-prompt-file> [--marker STR]" >&2
  exit 2
fi

if [[ ! -s "$TASK" ]]; then
  echo "compose-prompt: task file missing or empty: $TASK" >&2; exit 2
fi
if [[ ! -s "$ENV_RULES" ]]; then
  echo "compose-prompt: env-rules file missing: $ENV_RULES" >&2; exit 2
fi

{
  echo "FIRST THING: echo $MARKER before anything else."
  echo ""
  cat "$ENV_RULES"
  echo ""
  echo "=== TASK ==="
  echo ""
  cat "$TASK"
} > "$OUT"

echo "wrote $OUT ($(wc -l < "$OUT") lines)"
