# Finding 002 — Orchestration patterns that bit us (team spawn + idle signal)

**Date:** 2026-04-17
**v2-specific:** No — affects any skill using the TeamCreate / Agent tool pattern.
**Severity:** Medium (recoverable; cost is confusion and minutes lost).
**Status:** Captured in global memory (`feedback_team_idle_notifications.md`); suggest explicit codification in the `ls-team-impl(*-v2)` skill body.

## Summary

Two orchestration-level patterns tripped up the first attempt at Story 0 before we even reached the Codex-sandbox issue. Both are silent failures that look like the agent is stopped or stuck when actually they're well-defined platform behaviors. Both would bite v1 identically.

## Pattern A — Agent-tool `prompt` field does not deliver reliably to team-spawned teammates

**Observed:** Spawned a teammate via `Agent({team_name, name, subagent_type, prompt, mode})`. The teammate woke up, had no work in its inbox, and emitted 4 idle notifications in 11 seconds before sitting silent. Meanwhile the teammate had no actual task to do.

**Diagnosis:** The `prompt` parameter on `Agent` does not auto-route into the teammate's mailbox when the teammate is spawned with `team_name`. The Agent tool's confirmation message "The agent is now running and will receive instructions via mailbox" hints at this — instructions come from mailbox deliveries (SendMessage), not from the spawn-time prompt. Without an explicit `SendMessage`, the teammate has nothing to do.

**Fix:** After `Agent({team_name, ...})`, immediately follow with `SendMessage({to: <teammate-name>, message: <task>})` carrying the full task text. The spawn-time prompt appears to be ignored for team-spawned teammates.

**Proof by contrast:** An earlier attempt that used `Agent` WITHOUT `team_name` (a standalone subagent) did receive the prompt at spawn and immediately worked on it. Teams treat spawn differently.

## Pattern B — Idle notifications emit during active work

**Observed:** After fixing Pattern A, the teammate started actively running Codex in the background. Across the next 15+ minutes the teammate emitted periodic idle notifications (roughly every 2-3 minutes) even while Codex was actively running and generating hundreds of JSONL events. Initially interpreted these as the teammate being stopped.

**Diagnosis:** Every message a teammate sends back to the team-lead ends one of the teammate's conversation turns, which fires an idle notification. If the teammate is polling a background process and occasionally emitting status messages, every status message creates an idle notification even though the actual work continues. Idle notifications are NOT a reliable "stopped" signal.

**Fix:** Orchestrator should ignore idle notifications and wait for explicit substantive `SendMessage`s from the teammate. Only nudge if the teammate goes silent for a duration truly unreasonable for the scope of work (e.g., >20 min for a multi-minute Codex exec).

## Recommended skill changes

### 1. `ls-team-impl(*-v2)` On Load + Story Implementation Cycle

Add a short "Teammate mailbox delivery" note to the story implementation cycle:

```
When spawning a teammate on the team, immediately follow with a SendMessage
that delivers the full task text. Do not rely on the Agent tool's `prompt`
field — team-spawned teammates do not reliably pick it up. If a newly spawned
teammate emits 3+ idle notifications in quick succession without any
substantive message, assume the mailbox is empty and deliver via SendMessage.
```

### 2. Clarify idle-signal semantics in the skill's Operational Patterns section

The skill already has "Idle Notifications Are Unreliable Signals" — extend it with the two specific failure modes:

- *Rapid bursts immediately post-spawn = empty inbox.* Action: SendMessage the task.
- *Periodic idles during long-running work = conversation-turn boundaries.* Action: ignore; wait for substantive message.

### 3. Consider an `AgentWithMailbox` ergonomic helper

Speculative but worth raising: a combined spawn + deliver operation that atomically creates a teammate and delivers its first task to the mailbox. Would eliminate the cognitive trap entirely. Out of skill scope — that's a platform change.

## Why this matters for v2 specifically

v2's workflow relies heavily on multi-teammate orchestration — an implementer teammate and a reviewer teammate per story, every one of them team-spawned. The Agent-tool pitfall bites once per teammate spawn. Over a 10-story epic that's 20 opportunities to lose 5-10 minutes each if the orchestrator hasn't internalized the pattern. The idle-notification confusion bites continuously during every teammate's active work.

## Artifacts

- Global memory (applies across projects and future orchestrations): `feedback_team_idle_notifications.md` (indexed in `MEMORY.md`).
- Log entry: `team-impl-log.md` §Process Notes (2026-04-17 entries on team creation correction and idle-notification pattern).
