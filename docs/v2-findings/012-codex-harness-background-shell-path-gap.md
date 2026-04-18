# Finding 012 — Codex harness wrapper exits 127 transiently (misdiagnosed as PATH gap)

**Date:** 2026-04-18
**Story:** Epic 1 / Story 7 fix round (preload-entry fix)
**v2-specific?** No — harness / Windows-environment issue, same risk under v1.
**Status:** PATH diagnosis was wrong — `codex` IS on PATH in Bash-tool background shells. The exit 127 was transient (stale process or startup race). Leaving the harness-guard recommendation in place anyway (defense in depth); the silence-on-failure recommendation for the teammate template stands unchanged.

---

> **Update 2026-04-18 (same day, corrected diagnosis):** Verified post-finding that `C:\Users\dsavi\AppData\Roaming\npm` is present in the Windows user-level PATH AND is correctly inherited by both foreground and background Bash-tool subshells (`which codex` → `/c/Users/dsavi/AppData/Roaming/npm/codex`, exit 0). Neither `.bashrc` nor a manual `export` was needed. The first-attempt `wrapper exit: 127` must therefore have come from a transient cause — most likely a stale `codex.exe` process, startup race, or an internal command in `run-codex-with-retry.sh` other than `codex` itself. The second attempt succeeded without any environmental change. The "fnm PATH not sourced in background shells" hypothesis in the original writeup is incorrect for this machine's configuration.
>
> **What still stands:** the teammate-silence-on-failure observation is real and independently valuable. The "harness-side PATH guard" recommendation is still reasonable as defense-in-depth, but is not the root cause of the observed incident.
>
> **Update 2026-04-18 — distinct finding surfaced during this correction:** the observed "teammate silence" had a second contributor beyond the §Step 6 reporting gap. When a teammate completes its task and exits, the team config `members` list shrinks to just team-lead. Subsequent `SendMessage({to: 'impl-story-7', …})` calls from team-lead silently enqueue into a nonexistent inbox — no delivery failure signal. Team-lead interprets the silence as "teammate is working" when in fact the teammate process is gone. For mid-story fix rounds, this creates a trap: the natural instinct is to reuse the teammate (context already loaded), but the teammate may have exited after its prior report. **Mitigations:** (a) orchestrator should verify `.claude/teams/<team>/config.json` `members[]` includes the target name before SendMessage, (b) always spawn a fresh teammate for a fix round rather than assuming the original is alive, (c) prompt template should say "SendMessage the report, then remain idle in case team-lead has follow-up; do not exit until explicitly told." This is worth its own finding if it recurs; filing here for now since the observed incident chain included it.

## Summary

During the Story 7 preload fix round, impl-story-7's first harness invocation exited with `wrapper exit: 127` and an empty (0-byte) JSONL. *Original hypothesis (corrected above):* the Bash-tool subshell that ran `scripts/codex/drive-until-green.sh` did not have `codex` on PATH, because fnm's node-path injection doesn't apply in non-login/non-interactive subshells on this Windows + Git Bash setup. Running the same command from the teammate's interactive bash succeeded — `which codex` returned `/c/Users/dsavi/AppData/Roaming/npm/codex` and `codex --version` reported `codex-cli 0.120.0`.

The driver wrote an auto-report with verdict `UNKNOWN_WRAPPER_EXIT_127`; the teammate went silent (did not relay it) — re-surfacing the "gap B" pattern the harness runbook already warns about.

## What happened

1. Team-lead dispatched a fix-round task to impl-story-7 via SendMessage (Story 7 §Packaging preload-slot defect — Finding 011).
2. Teammate composed the task file + compose-prompt output successfully.
3. Teammate ran `drive-until-green.sh` via Bash tool with `run_in_background: true` (standard pattern).
4. Wrapper exited 127. Driver log:
   ```
   [drive] wrapper exit: 127
   [drive] wrapper exit 127 — unknown; escalating
   ```
   JSONL was 0 bytes — Codex never launched.
5. Teammate did not SendMessage the team-lead with the failure. Team-lead discovered it by polling the filesystem after a second idle-notification burst.
6. Team-lead nudged teammate to capture `which codex`, `codex --version`, and `$PATH | grep npm` — all returned valid values from teammate's interactive shell.
7. Teammate retried the harness from the interactive shell; Codex launched normally.

## Impact

- +1 round-trip of human-in-the-loop diagnosis during a story mid-cycle.
- Re-validates the runbook's Gap B warning ("Implementer silence post-completion") — but this is a broader variant: silence on *any* failure, not just post-success. The auto-report existed and contained the diagnosis; the teammate still did not relay it.
- Codex harness currently assumes `codex` is discoverable wherever `drive-until-green.sh` runs. For Windows + Git Bash + fnm, that assumption is not safe in background subshells.

## Root cause

`fnm` sets up PATH via shell-profile evaluation (`.bashrc` / `.bash_profile`). Interactive bash sessions source these automatically. The Bash tool's `run_in_background: true` mode spawns a non-login, non-interactive subshell where those profiles are not sourced; `fnm` never runs; the npm-global-bin directory (`/c/Users/dsavi/AppData/Roaming/npm`) never gets on PATH; `codex` is not resolvable; the wrapper's first `codex exec` exits 127.

This is the same PATH warning visible in every team-lead bash invocation:
> `warning: The current Node.js path is not on your PATH environment variable. You should setup your shell profile to evaluate `fnm env`…`

It's not fatal for team-lead because fnm-shimmed commands (pnpm, node, tsc via pnpm scripts) fall through to the project-local node_modules or Windows PATH equivalents. But `codex` is installed globally via npm and only resolves through the fnm-managed PATH slot.

## Recommended harness change

Two complementary fixes:

**Fix 1 (lightweight): harness-side PATH guard.** At the top of `run-codex-with-retry.sh`, verify `codex` is resolvable before invocation, and fail fast with a clear error if not:

```bash
if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: codex not on PATH. Add /c/Users/dsavi/AppData/Roaming/npm to PATH or source fnm env." >&2
  exit 127
fi
```

Even better — prepend the npm-global-bin to PATH explicitly at the top of the wrapper so background shells work regardless of profile sourcing:

```bash
export PATH="/c/Users/dsavi/AppData/Roaming/npm:$PATH"
```

The path is hard-coded in this finding for this machine; the wrapper could resolve it dynamically via `npm config get prefix` if `npm` is available, or fall back to a checked-in default.

**Fix 2 (verdict-classification): add exit 127 as a recognized verdict in `check-codex-completion.sh`.** Currently the driver reports `UNKNOWN_WRAPPER_EXIT_127`. Adding a stable `CODEX_NOT_ON_PATH` verdict (exit code e.g. 17) would let the driver produce a clearer escalation message, and would train teammates to recognize the class of failure.

## Recommended skill change

The harness runbook (`docs/codex-harness.md` §Troubleshooting) should add a row:

| Verdict | Diagnosis | Action |
|---------|-----------|--------|
| `CODEX_NOT_ON_PATH` / wrapper exit 127 | `codex` not resolvable in the background subshell; fnm PATH not sourced | `export PATH="/c/Users/dsavi/AppData/Roaming/npm:$PATH"` in the teammate's bash before invoking the driver. |

And a companion line in `docs/codex-harness.md` §Teammate usage noting that Bash-tool background shells may not inherit fnm PATH and recommending either the explicit export or Fix 1 above.

## Recommended ls-team-impl-v2 change

Harden "Don't stay silent" language in the materialized handoff template. Current wording says the teammate should relay the impl-report "on success"; it should say "on every driver exit, success or failure, always". The teammate in this case had the auto-generated report available on disk and still did not SendMessage. Stronger template language (plus the existing materialization-to-log structural intervention) may close the gap further.

## Artifacts

- Failing driver log: `C:/Users/dsavi/AppData/Local/Temp/codex-story-7-fix-preload.driver-log.txt`
- Empty JSONL: `C:/Users/dsavi/AppData/Local/Temp/codex-story-7-fix-preload.iter-1.jsonl` (0 bytes)
- Auto-report: `C:/Users/dsavi/AppData/Local/Temp/codex-story-7-fix-preload.impl-report.md` (verdict `UNKNOWN_WRAPPER_EXIT_127`)
- Teammate's PATH diagnostic SendMessage (after nudge): `which codex` → `/c/Users/dsavi/AppData/Roaming/npm/codex`.
