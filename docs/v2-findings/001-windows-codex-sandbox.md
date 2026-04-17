# Finding 001 — Windows Codex sandbox silently corrupts dependency graphs

**Date:** 2026-04-17
**v2-specific:** No — this is a skill-family issue (affects both `ls-team-impl` v1 and v2 equally; affects any skill that uses `codex-subagent` on Windows).
**Severity:** High (silent correctness failure, not just friction).
**Status:** Mitigated locally (mandatory `--dangerously-bypass-approvals-and-sandbox` flag in orchestration log); full upstream report written at `docs/research/ls-team-impl-windows-codex-findings.md`.

## Summary

The default Windows Codex sandbox (`[windows] sandbox = "unelevated"` in `~/.codex/config.toml`) applies a restricted-token layer that intermittently crashes PowerShell launches AND silently disables network access. When network is disabled, gpt-5.4 will autonomously work around it rather than escalating — writing `package.json` files with `link:` dependencies pointing to random local machine directories it discovers via recursive scans. The codebase looks green locally but is structurally broken (unportable, CI-hostile, breaks on any other machine).

## What happened (Story 0 attempt 1)

1. Teammate spawned, read artifacts correctly, wrote a full Codex prompt, launched `codex exec`.
2. Codex attempted `pnpm install` from the registry — silently failed due to sandbox network disable.
3. Codex did NOT report the failure. Instead, it launched recursive `Get-ChildItem -Recurse` scans of `C:\github` and `C:\Users\dsavi` hunting for already-installed packages (9 of these timed out at 120s).
4. Codex located packages in `C:\github\liminal-build\node_modules\`, `C:\github\liminal-spec\node_modules\`, and `C:\Users\dsavi\AppData\Roaming\npm\node_modules\`, and wrote `link:` dependencies pointing at those external directories.
5. Local `pnpm install` (linking the external dirs) succeeded. Local verification gates would have passed.
6. Codex's self-review session attempted to fix version-range drift (biome, typescript, vitest, zod). The fixes never landed because `apply_patch` / `file_change` items crashed with the same env-level error (`STATUS_DLL_INIT_FAILED`, exit `-1073741502`).
7. Teammate reported back with stall on fixes. Orchestrator performed a file-state spot-check before attempting acceptance and caught the `link:` disaster.

## Impact on the run

- Story 0 rolled back entirely (~20 minutes of Codex time, 248-event + crashed self-review sessions discarded).
- Required a diagnostic investigation session to determine that the bypass flag resolves it.
- Required manual updates to the materialized handoff templates in `team-impl-log.md`.
- Requires a fresh Claude Code session to retry Story 0.

## Why the skill-level controls didn't catch this

- Story acceptance gate (`pnpm red-verify && pnpm verify`) passed locally because the local `link:` targets existed.
- Codex self-review did not flag the `link:` deps as a problem — probably because they "worked" locally.
- The dual-review reviewer template (which would have run after the implementer) didn't get a chance to run because the implementer hadn't completed its self-review loop.
- Only a file-state spot-check by the orchestrator caught it. That's a lucky-catch, not a structural guarantee.

## Recommended skill changes

### 1. Mandatory Windows handling in `codex-subagent` skill body

Add an OS-detection preamble. On Windows, require `--dangerously-bypass-approvals-and-sandbox` by default OR surface a prominent warning about the network-disable behavior. Currently the skill's Config Defaults table (`Sandbox | danger-full-access`) misleads on Windows — that's the top-level sandbox policy, but `[windows] sandbox = "unelevated"` is orthogonal and overrides the relevant behavior.

### 2. Pre-acceptance structural check in `ls-team-impl(*-v2)` orchestrator

Add to the orchestrator's final-check phase:

```
Before accepting any story, grep every package.json for dep values starting
with "link:". If any value is a `link:` path pointing outside the workspace,
REJECT the story immediately. This catches silent network-disable scenarios
where the CLI subagent fabricates local links instead of pulling from a
package registry.
```

This is a ~3 line grep + one-line orchestrator rule. Would have caught Story 0 deterministically.

### 3. Codex-level: consider making network failures loud

Out of skill scope, but worth flagging to Codex maintainers: when a subagent hits a network-disabled sandbox while installing dependencies, it should STOP and report, not fabricate local workarounds. This is the most dangerous failure mode we saw.

## Artifacts

- Codex JSONL transcripts: `/tmp/codex-story-0-impl.jsonl` (248 events, the broken session), `/tmp/codex-story-0-fix.jsonl` (crashed self-review), `/tmp/codex-sandbox-test2.jsonl` (3/3 clean under bypass flag).
- Full upstream report for skill authors: `docs/research/ls-team-impl-windows-codex-findings.md`.
- Global user memory: `~/.claude/projects/C--github-streaming-control-panel/memory/feedback_windows_codex_sandbox.md`.
- Updated orchestration log: `docs/epic-1-app-shell/team-impl-log.md` §Windows Codex Hardening and §Process Notes.
