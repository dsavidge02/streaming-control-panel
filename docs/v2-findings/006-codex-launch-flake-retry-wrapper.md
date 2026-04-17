# Finding 006 — Windows PowerShell launch flake (`STATUS_DLL_INIT_FAILED`) warrants a shell-side auto-retry wrapper around `codex exec`

**Date:** 2026-04-17
**v2-specific:** No — skill-family issue affecting any `codex-subagent` user on Windows.
**Severity:** Medium (individual occurrences are cheap — Codex aborts in ~30s for ~800 tokens — but each one costs an orchestrator round trip and human attention, which adds up fast across an epic with 10+ Codex invocations).
**Status:** Mitigated in production. Initial wrapper design was too narrow (first-command-only detection — see "First wrapper design was wrong" below). Final working pattern captured in finding 007.

## Summary

Codex on Windows intermittently fails its first PowerShell subprocess launch with `STATUS_DLL_INIT_FAILED` (Windows NT status code `0xC0000142`, decimal `-1073741502`). Finding 001 first identified this — "~9% of PowerShell launches" under the default sandbox — but today we confirmed the flake also occurs *under* `--dangerously-bypass-approvals-and-sandbox`. The flake is at the OS loader level (DLL init), not a Codex or sandbox issue per se.

Because every well-designed Codex prompt now includes an "abort on first failure" rule (rule 5 in our environment-rules block, added to prevent the link:-fallback regression from finding 001), a single DLL-init-failed launch reliably aborts the entire Codex session before any real work happens. The prompt is fine, delivery is fine, the model is fine — one unlucky subprocess launch wastes the run.

## What happened (Story 0 attempt 3, 2026-04-17)

1. All earlier bugs mitigated: Windows sandbox bypass active (finding 001), path convention correct (finding 004), workdir pre-created where needed (finding 005), delivery-check marker in place.
2. Codex session `019d9bdd-45ee-7ef2-99c2-62472ec791f1` launched. Delivery check returned marker count 3 in JSONL (prompt received cleanly, Codex saw the env-rules block).
3. Codex's first command was the delivery-check echo:
   ```
   "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -Command
       'Write-Output DELIVERY_CHECK_MARKER_ECHO_7077'
   ```
   Exit code: `-1073741502`. Stdout empty. PowerShell never initialized.
4. Codex honored rule 5 and aborted cleanly. Final message was accurate: "Command failed on the required first step ... Per your rule 5, I stopped here and made no further changes." Zero files written, repo pristine.
5. Total cost: ~30 seconds, 32K input / 751 output tokens. Orchestrator round trip to team-lead to report the flake + propose retry.

## Impact on the run

- One wasted Codex invocation per flake occurrence (~30s, ~33K tokens total).
- One orchestrator ↔ team-lead round trip per flake to reach the "just retry" decision.
- If flakes cluster (observed: 1 in ~4 runs today under bypass flag — small sample), a 10-story epic would pay this tax 2–3 times.
- Intermediate mental cost: each flake initially looks like a "Codex aborted on delivery check" which invites investigation before the `-1073741502` exit code is parsed.

## Why the skill-level controls didn't catch this

- The skill body's "abort on failure" rule is load-bearing for correctness (it's what stops the link:-fallback hallucination). We cannot loosen it.
- But the abort rule doesn't distinguish between "the underlying OS refused to launch PowerShell" (transient, flaky, retry-safe) and "pnpm install reported a dependency conflict" (real, don't retry). Both produce non-zero exits and both trip rule 5.
- There is no built-in retry logic in `codex-subagent`. The skill's examples show `codex exec --json ... > out.jsonl` as a one-shot; no wrapper, no flake handling.

## Mitigation shipped this session

**Gotcha discovered during first wrapper run:** the JSONL field carrying a command's exit code is `exit_code`, NOT `exit`. The `codex-result commands` helper abbreviates it as `"exit"` in its JSON output, but the raw JSONL uses `"exit_code": <number>` inside each `item.completed` event with `item.type == "command_execution"`. The first version of this wrapper grepped for `"exit":-?[0-9]+` and matched nothing, so every run was classified as "clean" regardless of actual outcome — including the very next STATUS_DLL_INIT_FAILED recurrence. Fixed by grepping `"exit_code":-?[0-9]+`. Any future wrapper authored from the `codex-result` examples must read raw JSONL field names, not the summary helper's output.

### First wrapper design was wrong (Story 0 attempt 4, 2026-04-17)

The initial wrapper I shipped had two bugs that only surfaced when used in anger:

1. **Wrong JSONL field name.** I grepped for `"exit":-?[0-9]+` because `codex-result commands` abbreviates the field as `"exit"` in its JSON summary. The raw JSONL actually uses `"exit_code":<number>` inside each `item.completed` event with `item.type == "command_execution"`. My first wrapper returned `first_exit=""` on every run and reported "clean run" regardless of actual outcome. Caught only when a second flake went undetected. **Fix:** grep for `"exit_code":-?[0-9]+`. Future wrappers must read raw JSONL field names, not the `codex-result` helper's abbreviated output.

2. **Flake detection assumed first-command-only.** I designed the retry logic to trigger only when the FIRST command in the JSONL flaked — reasoning that STATUS_DLL_INIT_FAILED is a cold-start PowerShell-loader issue. Empirically wrong: in one Story 0 attempt, Codex ran 3 successful `Get-Content` reads, then hit 3 consecutive `-1073741502` failures on subsequent reads mid-turn. The flake can cluster at any depth. My wrapper saw "first command = exit 0" and passed through "REAL_ERROR" without retrying the cluster that was actually the flake. **Fix:** retry whenever ANY `command_execution` in the JSONL has `exit_code == -1073741502` with empty `aggregated_output`, regardless of position — UNLESS there's also a legitimate non-flake error (in which case the real error wins and we don't retry).

Both issues were caught by adding an independent ground-truth completion checker script (see finding 007) that classifies a JSONL into FLAKE_DETECTED / REAL_ERROR / OK / etc. and returns distinct exit codes the wrapper can switch on. This inversion — wrapper delegates verdict to a separate checker rather than embedding its own narrow detection — is the working pattern.

### Final wrapper shape

Wrapper script at `C:/Users/dsavi/AppData/Local/Temp/codex-retry/run-codex-with-retry.sh`:

- Runs `codex exec --json --dangerously-bypass-approvals-and-sandbox - < <prompt> > <out.jsonl>`.
- After Codex exits, scans the JSONL for exits in order:
  - If the FIRST `command_execution` has `exit: -1073741502` **and** no earlier command succeeded, classify as the launch flake.
  - Any other failure (first command succeeded but a later one failed; first command failed with any other exit code) passes through untouched — we don't paper over real errors.
- Retries up to 3 times total with 2-second backoff between attempts.
- Saves each flaky attempt's JSONL to `<out>.flake-attempt-<N>.jsonl` for audit.
- Exits 0 on first clean run, 42 when flake retries are exhausted, or Codex's own non-zero exit code if Codex itself errored in a different way.
- Zero prompt contamination — Codex has no knowledge of the wrapper.

## Recommended skill changes

### 1. In `codex-subagent` skill body — ship a reference retry wrapper

Add a documented "recommended launcher" pattern alongside the bare `codex exec` example, specifically for Windows users. Either inline the ~50-line bash script (preferred, since it's small) or link to the upstream one shipped with the skill:

```
### Windows — recommended launcher for flake handling

On Windows, wrap `codex exec` in a retry loop that detects
STATUS_DLL_INIT_FAILED (exit -1073741502) on Codex's FIRST command and
retries up to N times. This is safe because the flake is a PowerShell
loader issue that occurs before any user code runs; it cannot corrupt
state. Do not retry on any other failure — real errors must still abort
per the environment-rules block in your prompt.

    # Minimal wrapper (keep or inline per your preference)
    attempt=1
    while (( attempt <= 3 )); do
      codex exec --json --dangerously-bypass-approvals-and-sandbox - \
        < "$PROMPT" > "$OUT" 2>/dev/null || break
      first_exit=$(grep -oE '"exit":-?[0-9]+' "$OUT" \
        | grep -oE '\-?[0-9]+' | head -n1)
      if [[ "$first_exit" != "-1073741502" ]]; then break; fi
      cp "$OUT" "${OUT%.jsonl}.flake-attempt-$attempt.jsonl"
      sleep 2
      attempt=$((attempt+1))
    done
```

### 2. In `ls-team-impl(*-v2)` orchestration templates — use the wrapper by default

Replace raw `codex exec` invocations in the implementer and reviewer templates with the retry wrapper. Orchestrator receives exactly the same `<out.jsonl>` and decision tree as before — the wrapper is transparent.

### 3. Cross-skill: log the flake in user memory

Add to `~/.claude/.../memory/feedback_windows_codex_sandbox.md` (the existing Windows Codex feedback memory from finding 001):

```
Even under --dangerously-bypass-approvals-and-sandbox, Codex on this machine
intermittently fails its first PowerShell launch with STATUS_DLL_INIT_FAILED
(exit -1073741502). Use the shell-side auto-retry wrapper at
C:/Users/dsavi/AppData/Local/Temp/codex-retry/run-codex-with-retry.sh (or
inline equivalent) for every codex exec invocation. 3 retries has been
sufficient in practice.
```

This keeps future Claude sessions from retracing the diagnosis each time the flake hits.

### 4. Upstream to Codex maintainers (out of skill scope)

The STATUS_DLL_INIT_FAILED on PowerShell launch is likely a sandbox-shim + DLL-loader interaction. Even with the bypass flag, Codex still wraps commands in PowerShell instead of using its `sh` / `cmd` fallback on Windows, and PowerShell's DLL initialization is more fragile under the restricted-token shim than `cmd.exe` is. A cheap upstream fix might be: fall back to `cmd.exe /c` or direct binary exec for simple echo/test commands, reserving PowerShell for cases that genuinely need it.

## Artifacts

- Wrapper source: `C:/Users/dsavi/AppData/Local/Temp/codex-retry/run-codex-with-retry.sh`
- Example flake JSONL: `C:/Users/dsavi/AppData/Local/Temp/codex-story-0-v3-impl.jsonl` (pre-wrapper run), session `019d9bdd-45ee-7ef2-99c2-62472ec791f1`.
- Windows NT status code reference: `0xC0000142` = `STATUS_DLL_INIT_FAILED` — "DLL initialization failed."
- Related: finding 001 (Windows Codex sandbox / network disable), finding 004 (path mapping), finding 005 (workdir chicken/egg).
