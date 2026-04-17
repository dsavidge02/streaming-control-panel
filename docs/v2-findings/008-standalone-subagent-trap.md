# Finding 008 — The standalone-subagent trap for "quick fixes"

**Date:** 2026-04-17
**v2-specific:** No — affects any skill using the TeamCreate / Agent tool pattern; orthogonal to UI-spec v2 surface.
**Severity:** Medium (silent workflow divergence; user caught it twice).
**Status:** Captured in project-scoped memory (`feedback_always_spawn_as_teammate.md`); suggest explicit codification in the `ls-team-impl(*-v2)` skill body.

## Summary

The `ls-team-impl(*-v2)` skill's "Orchestrator Role" section instructs the orchestrator: *"Quick fixes (typos, one-file adjustments) → fire a `senior-engineer` subagent."* On this project that guidance fires a separate failure mode: spawning a **standalone** subagent via `Agent()` without `team_name` diverges from the team-based workflow the rest of the skill enforces. The user has now caught this trap twice — first during the original Story 0 setup (2026-04-17, recorded in `team-impl-log.md` §Process Notes "Team creation correction"), and again during the Story 0 retry restart session when the orchestrator, loading the skill fresh, reflexively went to spawn a standalone subagent for two deferred-finding edits (PATHS shape reconciliation + `gateExempt.ts` filename rename).

The trap is not the skill's *literal* instruction — it's the *ergonomic path of least resistance* when the orchestrator sees "quick fix" and defaults to `Agent()` without team scoping.

## What happened (restart session, 2026-04-17)

Fresh Claude Code session opened Epic 1 at state `BETWEEN_STORIES`. Four prep steps were queued before spawning the Story 1 implementer; step 4 was to resolve two deferred Story 0 findings via "a tight senior-engineer-style subagent or a minimal implementer round" (phrasing from user's startup brief).

Orchestrator ran `TeamCreate` for `epic-1-app-shell` successfully, then composed an `Agent({subagent_type: "general-purpose", prompt: <quick-fix spec>})` call — **without `team_name`**. The user interrupted the tool call before it executed:

> "it looks like you're about to spin up a subagent and not an agent teams agent, is that true?"

The orchestrator confirmed the mistake, re-spawned the worker with `team_name: "epic-1-app-shell", name: "story-0-deferred-fixes"`, and the work completed cleanly.

## Observed symptoms (when the trap fires)

1. **Task list invisibility.** `TaskCreate` calls made before `TeamCreate` (or to a teammate spawned without `team_name`) land in a default/previous task list. After `TeamCreate` the team-lead's `TaskUpdate` returns `Task not found` for those task IDs. `TaskList` shows empty until the tasks are recreated on the team's list. Silent — no error until the mismatch surfaces on update.

2. **Permission posture divergence.** Process Notes 2026-04-17 documents that standalone subagents inherit a stricter Bash permission posture than team-spawned teammates — in the original Story 0 attempt, a standalone subagent could not run `codex` even though the orchestrator's own Codex ping worked from the same repo. Respawning with `team_name` + `bypassPermissions` mode resolved it.

3. **No team-workflow integration.** The worker doesn't appear in `TaskList`, doesn't emit idle notifications to the team-lead's conversation, and can't be addressed via `SendMessage`. You lose the team's observability.

4. **Reviewer/verification contract drift.** The skill's Control Contract assumes work flows through the team (teammate reports via `SendMessage`; orchestrator audits against the task list). A standalone subagent returns via `Agent`'s synchronous result only — no task-list trace, no message history with the team-lead, no visibility for a later reviewer or future session.

## Why this trap fires despite the skill telling you to use teams

Three reinforcing factors:

1. **Skill language asymmetry.** "Quick fixes → fire a `senior-engineer` subagent" reads as a *different spawn mechanism* from the full story cycle. The word "subagent" in that sentence maps naturally to "`Agent()` without team machinery." Contrast the reviewer/implementer sections, which consistently use "teammate" and reference `team_name`.

2. **Tool default.** `Agent` without `team_name` is a valid, one-shot invocation with a lower ceremony cost — no prior `TeamCreate` needed. For a 3-line edit, the ceremony of joining the team "feels" excessive. The skill's default answer to that feeling is "just spawn a subagent" rather than "still spawn as a teammate."

3. **Fresh-session amnesia.** On a fresh Claude Code session, the team directory at `~/.claude/teams/epic-1-app-shell/` does not persist (see `reference_team_directory_ephemeral.md`). The orchestrator recreates the team, but the cognitive pattern of "team-based workflow for stories, subagents for quick fixes" can re-emerge because the skill's Orchestrator Role text is the first thing the re-loaded skill emphasizes.

## Impact on the run

**Low, because the user caught it both times** (cost ≈ 2 minutes each: the tool call denial + corrective respawn). If the user had not been watching:

- The deferred-fix work would have landed, but without task-list trace or mailbox evidence.
- The orchestrator's `TaskUpdate` against the pre-TeamCreate task IDs would have returned `Task not found` silently, and the orchestrator might have continued without realizing the task list was on the wrong team.
- The pattern would have reinforced itself across future stories — every "quick fix" reached for the standalone-subagent shape, fragmenting the orchestration log's evidence base.

## Recommended skill change

### 1. Re-word the Orchestrator Role routing rule

Current text in `ls-team-impl-v2` On Load → The Orchestrator's Role:

> Quick fixes (typos, one-file adjustments) → fire a `senior-engineer` subagent

Proposed replacement:

> Quick fixes (typos, one-file adjustments) → spawn a short-lived teammate on the active team (same `team_name`, a descriptive one-shot `name` like `<story-N>-quickfix`). Even for 3-line edits, keep the worker on the team so task-list state, mailbox history, and permission posture stay consistent. The `senior-engineer` subagent type is the wrong default here — it bypasses team observability and has caused silent task-list fragmentation and permission divergence in practice.

### 2. Add a subsection under On Load → Create Team

Add immediately after "Create a team at the start of the implementation":

> **Team-vs-subagent discipline.** Every worker spawned during the epic — implementers, reviewers, and one-shot quick-fix agents — is spawned as a teammate on the epic team via `Agent({team_name, name, subagent_type})`. Never spawn a standalone subagent (`Agent` without `team_name`) during orchestration. Standalone subagents inherit a stricter permission posture, don't appear in `TaskList`, and their work history is invisible to the team-lead. The `senior-engineer` phrasing in the Orchestrator Role section refers to a worker's *type*, not to a distinct spawn mechanism.

### 3. Add TaskCreate/TeamCreate ordering note

Add to the same section (or to On Load → Full Initialization):

> On a fresh session (or after context stripping), `TeamCreate` must run before any `TaskCreate`. Tasks created before the team exists land in a default/previous task list and are invisible to the team after creation — subsequent `TaskUpdate` against those IDs returns `Task not found`. Recreate the tasks on the team's list after `TeamCreate` if this happens.

### 4. Cross-reference idle-notification finding (002)

Add: "Immediately after `Agent({team_name, ...})`, follow with `SendMessage` delivering the full task text — the Agent tool's `prompt` field does not reliably auto-deliver for team-spawned teammates (see Finding 002 Pattern A)."

## Why this is worth upstreaming (not just a project memory)

Finding 002 documents the *delivery-to-mailbox* trap (correct team spawn, wrong delivery mechanism). This finding documents the *spawn-mechanism* trap itself (wrong spawn mechanism entirely). Both are silent failures. Both live in the same skill surface area. The combined cost on a 10-story epic, if the orchestrator is new to the skill and has to rediscover each trap, is roughly 30–60 minutes plus the fragmentation cost of work that landed outside the team's observability.

The fix is textual: re-word two sentences in the skill body. No platform change required.

## Cross-references

- Project memory: `feedback_always_spawn_as_teammate.md` (indexed in `MEMORY.md`).
- Prior incident: `docs/epic-1-app-shell/team-impl-log.md` §Process Notes "2026-04-17 · Team creation correction."
- Related: Finding 002 (team-spawn prompt delivery); `reference_team_directory_ephemeral.md` (fresh-session team recreation).
