# Finding 009 — Session-wide Codex flake walls (distinct from per-command flakes)

**Date:** 2026-04-17
**v2-specific:** No — Windows Codex platform behavior. Applies to any skill using `codex-subagent` on this machine.
**Severity:** High — the pattern documented in findings 001/006/007 was insufficient for Story 1 and nearly produced a double-failure that would have looked like a Story-0-class regression.
**Status:** Mitigation identified (fresh-exec relaunch cap ≥3 + session-wall early-detection). Template updates landed in `team-impl-log.md` §Materialized Handoff Templates.

## Summary

Findings 001 and 006 characterized Windows `STATUS_DLL_INIT_FAILED` (exit code `-1073741502` with empty output) as a ~9%-base-rate **per-command** PowerShell-spawn flake. The documented mitigation was Rule 9's per-command retry (3× with 2s delay), plus finding 006's shell-side "auto-retry on flake" wrapper around the whole `codex exec` call.

Story 1 attempt #1 revealed a second mode of the same exit code: **session-wide walls** where *every* PowerShell spawn in a given Codex session fails with `-1073741502` from the very first command onward, across every distinct command shape (`echo`, `Start-Sleep`, file reads, `pnpm`, `Write-Output`). Per-command retry is useless against this mode — the whole session's PowerShell-spawn subsystem is walled off — and the flake-wrapper's default 2-relaunch cap sits exactly at the boundary where Story 1 needed 3 fresh execs to escape the wall.

## What happened (Story 1 attempts 1 + 2 + 3)

**Attempt 1** — `codex-story-1-impl.walled-attempts-raw-invocation.jsonl` (9 KB, 12:37):

```
item_0  echo DELIVERY_CHECK_MARKER_ECHO_7077                     → exit -1073741502, empty
item_2  Start-Sleep -Seconds 2                                   → exit -1073741502, empty
item_3  Start-Sleep -Seconds 2                                   → exit -1073741502, empty
item_4  Start-Sleep -Seconds 2                                   → exit -1073741502, empty
item_5  echo DELIVERY_CHECK_MARKER_ECHO_7077                     → exit -1073741502, empty
```

5 consecutive commands. Five different command surfaces (marker echo, sleep, sleep, sleep, marker echo retry). All fail with the same signature. The probability of that at the documented ~9% independent-flake base rate is `0.09^5 ≈ 5.9 × 10⁻⁶` — six orders of magnitude below what independent-flake models predict. This is not a statistical cluster. This is a session property.

**Attempt 2** — `codex-story-1-impl.flake-attempt-1.jsonl` (9 KB, 12:48):

Same pattern. 10+ consecutive commands all `-1073741502`. Codex's agent eventually concluded, verbatim:

> "Blocked by the shell environment before any repo work could start. I attempted the required first command `echo DELIVERY_CHECK_MARKER_ECHO_7077` immediately, then retried per Rule 9 with delays, but every `shell_command` invocation failed with `exit_code = -1073741502` and empty stdout/stderr. The same failure then occurred on fresh read probes as well, so I could not safely read the Story 1 artifacts, inspect existing files, edit `package.json`, install dependencies, or run the verification gates."

Noteworthy (and a positive signal): Codex did NOT fabricate success, did NOT write files blind, did NOT emit `link:` dependencies. It hit the wall, retried per Rule 9, still walled, and reported honestly. The env-rules block is load-bearing — without the explicit "abort on failure, no `link:` fallback" rules, Codex's default-recovery behavior (from the Story 0 rollback class) would likely have produced a corrupted dep graph here too.

**Attempt 3** — `codex-story-1-impl.jsonl` (118 KB, 12:50):

Launched ~2 minutes after attempt 2 ended. **Worked.** Completed initial read, wrote all 10 Story 1 deliverables via successful `apply_patch` operations, ran `pnpm red-verify`, caught real biome formatting issues, iterated a targeted fix, re-ran `red-verify`, and surfaced *legitimate* typecheck errors (missing `@types/node`, type narrowing in `registerRoute.ts`). Not a flake — actual implementation work producing actual, diagnosable errors to act on.

## The distinct failure modes

| Property | Per-command flake (findings 001/006) | Session-wide wall (this finding) |
|----------|--------------------------------------|----------------------------------|
| Exit code | `-1073741502` | `-1073741502` |
| Output | Empty | Empty |
| Affects | Individual `PowerShell.exe` invocation | Every `PowerShell.exe` spawn in the Codex session |
| Base rate | ~9% per command | Not per-command — session-property |
| Clears on | Retry the same command | Requires killing the session and spawning a fresh `codex exec` |
| Signature | 1 fail among many successes | N consecutive fails from command 0 onward, across heterogeneous command shapes |
| Rule 9 (per-cmd retry) | Effective | Useless — reaches retry cap immediately, still walled |
| Finding 006 wrapper | Catches the single-cmd case correctly | Retriggers a relaunch, but the default cap of 2 is a tight fit |

## Root-cause hypothesis (non-authoritative)

The `-1073741502` (`STATUS_DLL_INIT_FAILED`) is a Windows NTSTATUS that fires when `LoadLibrary`/`DllMain` fails during process startup. The restricted-token layer from the Codex Windows sandbox (`[windows] sandbox = "unelevated"` in `~/.codex/config.toml`) is the documented trigger for the per-command base rate (finding 001). The `--dangerously-bypass-approvals-and-sandbox` flag removes the restricted token and reduces the base rate dramatically — but does not fully eliminate it in all cases.

The session-wall mode is consistent with: the Codex host process acquiring a corrupted reference to a DLL context at startup, which then propagates to *every* child PowerShell spawn regardless of `--dangerously-bypass-approvals-and-sandbox`. Once the Codex process has that corruption, no sequence of command retries can clear it; only killing and respawning the Codex process does. This matches the observed pattern where two consecutive fresh `codex exec` launches both landed in walled sessions, then the third was clean.

Not confirmed — Codex is closed-source from the platform's perspective. The operational finding doesn't depend on the RCA being correct; it depends on the detection + mitigation being right.

## Detection heuristic

A Codex session is walled if the first `N` commands all fail with `exit_code == -1073741502` AND empty output, where `N ≥ 3` and the commands are heterogeneous (not the same command retried). In practice:

- 3 different command shapes all flaking from item_0 ≈ 99.99% confidence of a wall
- 5+ different command shapes all flaking = definitionally walled

The existing `check-codex-completion.sh` checker (finding 007 artifact) already produces `FLAKE_DETECTED` in this case because `successes=0`. What was missing is the caller-side behavior when FLAKE_DETECTED comes back at turn_completed=1 with no deliverables written — that's a wall, not a transient cluster.

## Mitigation (template updates)

1. **Fresh-exec relaunch cap bumped from 2 to 3.** Story 1 used exactly 3 total attempts to escape the wall (walled, walled, success). The previous cap of 2 (one initial + 1 relaunch = 2 attempts) would have escalated to human intervention before attempt 3. Bumping to 3 (initial + 2 relaunches) gives one-sigma headroom; beyond that escalation is correct.

2. **Wall detection rule added to the env-rules block.** New rule (call it Rule 9b or a wall-detection note under Rule 9): *"If the first 3 consecutive commands of the session all fail with `-1073741502` empty, abort the session immediately. Do not continue retrying per-command. Exit with a clear wall-detected message so the caller's wrapper relaunches."* This short-circuits wasted retry budget.

3. **Always relaunch as fresh `codex exec`, never `resume`.** Already documented in finding 007's residual notes and the team-impl-log template; re-emphasized here because the wall is a session property and `resume` inherits the session's corrupted state.

4. **Capture walled-attempt JSONLs separately.** The existing wrapper names them `<out>.walled-attempts-raw-invocation.jsonl` and `<out>.flake-attempt-<N>.jsonl` which is the right behavior — keep it. Useful audit trail.

## Residual gotchas (Story 1 exposed)

- **Codex's 3rd session ended mid-debug and the implementer didn't launch a 4th.** Codex wrote all 10 files, ran gates, caught real typecheck errors (missing `@types/node`), and then the turn ended without iterating on the fixes. The supervising implementer sat silent for 25+ minutes instead of launching a fresh `exec` to continue. Mitigation: add an explicit instruction to the implementer template that says *"If Codex's session ends with open gate failures that are clearly within its ability to fix (typecheck errors, formatting, dep additions), launch a fresh `exec` to continue before reporting to team-lead."* Classified under the skill's existing "Agents Forget to Report Back" pattern, but worth calling out as its own sub-pattern: "Agents forget to continue iterating after a turn boundary."

- **The typecheck errors Codex surfaced are legitimate Story 1 dependency gaps, not flakes.** `apps/panel/server` needs `@types/node` as a devDep (tech-design didn't spell this out; the handoff's deliverables list didn't either). Story 1's server code uses `node:path` and `process.env` which require `@types/node`. Future story handoffs that touch Node built-ins must explicitly include `@types/node` in the deliverables list.

- **Multiple stale `Codex.exe` processes accumulated in tasklist (7 observed).** Each walled/flaked session leaves an idle process. Not causally linked to the wall (they don't interfere with new sessions), but worth noting as a cleanliness issue for long-running orchestrators. The implementer/wrapper should kill prior Codex processes before launching fresh `exec`.

## Evidence

- Walled attempt 1 JSONL: `C:/Users/dsavi/AppData/Local/Temp/codex-story-1-impl.walled-attempts-raw-invocation.jsonl`
- Walled attempt 2 JSONL: `C:/Users/dsavi/AppData/Local/Temp/codex-story-1-impl.flake-attempt-1.jsonl`
- Successful attempt 3 JSONL: `C:/Users/dsavi/AppData/Local/Temp/codex-story-1-impl.jsonl`
- Completion report on attempt 2: `C:/Users/dsavi/AppData/Local/Temp/codex-story-1-impl.completion-report.txt` — verdict `FLAKE_DETECTED`, `successes=0 flakes=10 real_errs=0`, missing_paths=10, link_regressions=0, marker=yes.

## Cross-references

- Finding 001 — Windows Codex sandbox (root cause of the restricted-token layer).
- Finding 006 — Codex launch flake retry wrapper (the per-command framework this extends).
- Finding 007 — Working pattern for Windows Codex runs (the "proven end-to-end" compound pattern; Story 1 refines residual item #1 re: cluster handling).
- `docs/epic-1-app-shell/team-impl-log.md` §Materialized Handoff Templates — the mitigations landed in the templates.

## Recommended upstream actions

1. **Update finding 007's "residual gotchas" section** to cross-reference finding 009 and adjust the "cluster of 4+ consecutive flakes" language to "session-wide wall."
2. **Bump the launcher wrapper's default retry cap from 2 to 3.** Document the rationale: Story 1 evidence shows 3 total attempts is the needed floor.
3. **Add wall detection to the prompt env-rules block.** If first 3 commands flake, abort session immediately; stop burning Rule 9 retry budget.
4. **Propose to the `codex-subagent` skill maintainers** that they document the two distinct flake modes (per-command vs session-wide) and ship a caller-facing wall detector as part of the default wrapper.
