# Fresh-Session Restart Instructions — Epic 1 Story 0 Retry

**Use these steps when opening a new Claude Code session to retry Story 0 after the 2026-04-17 rollback.**

This document tells the new team-lead (a fresh Claude Code main-session agent) exactly what happened, what's already in place, and what to do.

---

## Quick start — paste this into the new session

```
Load the ls-team-impl-v2 skill and continue Epic 1.

Story 0 was attempted and rolled back on 2026-04-17 due to a Windows
Codex sandbox environment issue that silently disabled network access,
causing Codex to emit broken `link:` dependencies. The diagnosis,
mitigation, and updated handoff templates are all captured in:

  docs/epic-1-app-shell/team-impl-log.md

Before anything else, read that log end-to-end (especially §Windows Codex
Hardening and §Process Notes). It contains the mandatory
--dangerously-bypass-approvals-and-sandbox requirement and the updated
materialized handoff templates.

The team `epic-1-app-shell` already exists at
~/.claude/teams/epic-1-app-shell/config.json. Team persists across all
10 stories. Previous teammate `story-0-implementer` was shut down; you
will spawn a fresh one.

Current state: log state = BETWEEN_STORIES; cumulative test count = 0;
git working tree = clean at commit c06d9f5 (docs/, .claude/, .github/,
braindump.md untracked — those are the source docs, not Story 0 output).

Proceed with Story 0 implementation per the ls-team-impl-v2 story cycle,
using the updated templates in team-impl-log.md.
```

---

## What's already in place (don't redo)

| Artifact | Location | Status |
|----------|----------|--------|
| Epic spec | `docs/epic-1-app-shell/epic.md` | Finalized |
| Tech design (index + server/client companions) | `docs/epic-1-app-shell/tech-design*.md` | Finalized |
| Test plan | `docs/epic-1-app-shell/test-plan.md` | Finalized |
| UI spec | `docs/epic-1-app-shell/ui-spec.md` | Finalized (in scope from Story 5) |
| 10 story files | `docs/epic-1-app-shell/stories/00-*.md` through `09-*.md` | Finalized |
| Coverage artifact | `docs/epic-1-app-shell/stories/coverage.md` | Finalized |
| Team | `~/.claude/teams/epic-1-app-shell/` | Created; team-lead slot rebinds to new main session |
| Orchestration log | `docs/epic-1-app-shell/team-impl-log.md` | Current — contains rollback history, hardening, templates |
| Upstream feedback report | `docs/research/ls-team-impl-windows-codex-findings.md` | For liminal-spec maintainers |
| User feedback memories | `C:/Users/dsavi/.claude/projects/C--github-streaming-control-panel/memory/` | Three feedback files indexed in `MEMORY.md` |

## What the new session must do differently this time

1. **Every `codex exec` invocation** (implementer AND reviewer, initial AND resume) must pass `--dangerously-bypass-approvals-and-sandbox`. This is captured in `team-impl-log.md` §Windows Codex Hardening and baked into the materialized handoff templates there. Without this flag, Codex on Windows silently has no network and emits `link:` deps.

2. **The updated environment-rules preamble** (short form, 4 rules) must prepend every Codex prompt. The full preamble text is in the log.

3. **Structural check before accepting any story:** run `grep -rn '"link:' apps/*/package.json package.json`. Empty output is required. Any match blocks acceptance. This catches the same class of failure that the first Story 0 run produced.

4. **Team spawn pattern:** spawn teammates with `team_name: "epic-1-app-shell"`, `name: <story-N-implementer | story-N-reviewer>`, `subagent_type: "general-purpose"`, `model: "opus"`, `mode: "bypassPermissions"`. Deliver the task via a `SendMessage` immediately after spawn — the `Agent` tool's `prompt` field does not reliably auto-deliver to team-spawned teammates' mailboxes (captured in `feedback_team_idle_notifications.md`).

## Known failure modes to watch for (captured elsewhere — not in context again)

- Rapid idle bursts after spawn → empty inbox; SendMessage the task (memory: `feedback_team_idle_notifications.md`).
- Any `link:` dependency in any `package.json` → blocker; re-route to Codex with instructions to install from the registry.
- PowerShell launch failures with `-1073741502` → only possible if the bypass flag is missing; if seen, the team-lead forgot the flag.

## The failure timeline (for context only — skip if short on time)

1. First implementer spawned without `team_name` → subagent, not teammate. Bash blocked codex. User caught it. Team created, respawned as teammate. Fixed.
2. Team-spawned teammate had empty mailbox (rapid idle notifications). SendMessage delivered the task. Fixed.
3. Codex exec ran, wrote scaffolding with `link:` deps pointing at external machine directories. Self-review caught version-mismatches but apply_patch crashed (Windows restricted token). Fixes never landed.
4. Orchestrator investigated JSONL, found 10/106 PowerShell crashes + 9/106 timeout scans + 2/2 apply_patch crashes. Added long anti-PowerShell preamble.
5. Orchestrator did file-state spot-check before accepting Story 0 — caught the `link:` dep disaster. Investigated further with direct sandbox tests: confirmed `elevated` is worse than `unelevated`; confirmed `--dangerously-bypass-approvals-and-sandbox` is clean.
6. Rolled back. Saved global memory. Wrote upstream report. Updated templates. Created this doc.

## What to delete once Story 0 is green

Once Story 0 is accepted on retry, this `RESTART-INSTRUCTIONS.md` file becomes stale. Delete it at that point; the canonical history lives in `team-impl-log.md` §Process Notes.
