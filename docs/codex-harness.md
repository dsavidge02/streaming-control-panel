# Codex Harness — Definitive Runbook

**Purpose:** this is the single source of truth for running Codex on this project. If you follow this runbook, a Codex implementation or review session completes from "prompt composed" to "ground-truth gates green" with **zero orchestrator intervention**. It consolidates findings 001, 004, 005, 006, 007, and 009 into one procedural flow, and closes the two residual gaps that forced manual prodding during Story 1.

> **Who reads this:** implementer and reviewer teammates (the agents who supervise Codex); orchestrators who need to understand the contract; future skill maintainers.

---

## TL;DR

```bash
# From the implementer teammate, once you've composed a task section:
cd /c/github/streaming-control-panel

# 1. Assemble the full Codex prompt (env-rules block + task):
scripts/codex/compose-prompt.sh \
  C:/Users/dsavi/AppData/Local/Temp/story-N-task.md \
  C:/Users/dsavi/AppData/Local/Temp/codex-story-N-impl-prompt.md

# 2. Run the driver — this is the ONLY Codex command you run. It handles
#    flake retry, session-wall recovery, and gate-failure iteration:
scripts/codex/drive-until-green.sh \
  C:/Users/dsavi/AppData/Local/Temp/codex-story-N-impl-prompt.md \
  C:/Users/dsavi/AppData/Local/Temp/codex-story-N-impl \
  --gate "pnpm red-verify && pnpm verify"

# 3. If exit 0: relay the auto-generated report via SendMessage:
cat C:/Users/dsavi/AppData/Local/Temp/codex-story-N-impl.impl-report.md

# 4. If exit != 0: escalate to team-lead with the report's verdict + link.
```

No decisions, no manual retry, no manual fix-prompt composition, no report authoring from scratch. The driver handles everything.

---

## Why this runbook exists

Story 0 (attempts 1-5) and Story 1 between them accumulated six distinct failure modes. The existing scripts (`run-codex-with-retry.sh`, `check-codex-completion.sh`) handle the process-level ones correctly. Two gaps forced manual orchestrator intervention during Story 1:

1. **Turn-budget exhaustion mid-fix.** Codex catches real errors (typecheck, format), begins fixing them in-session, runs out of turn budget before the fix lands. The inner wrapper reports the session's verdict and stops. Nothing drives a follow-up `codex exec` with a fix-list prompt. The orchestrator had to manually read the JSONL, paste the errors, and tell the implementer to launch a follow-up.

2. **Implementer silence post-completion.** The supervising teammate sometimes completes the work but forgets to send the §Step 6 SendMessage report. The orchestrator had to extract CLI evidence from on-disk artifacts and proceed to the reviewer phase without the handoff.

`drive-until-green.sh` closes both gaps:

- **Outer iteration loop.** After every Codex exec, it runs the project's gate command directly from bash. If the gate fails but the verdict is "real error, not wall" (= Codex did real work but didn't finish), it composes a fix-list prompt from the gate output and launches a fresh exec. Up to 4 iterations by default.
- **Auto-generated §Step 6 report** at `<stem>.impl-report.md`. Contains CLI session IDs, wrapper verdicts, gate output, driver log, and the dispatch-ready action note. Teammate relays it verbatim; orchestrator can read it directly if the teammate goes silent.

---

## The algorithm

```
drive-until-green <initial-prompt> <stem>:
  for iter in 1..MAX_ITERATIONS (default 4):
    cleanup stale Codex.exe processes  # avoid process accumulation
    run-codex-with-retry.sh <prompt> <stem>.iter-N.jsonl   # inner wrapper:
                                                             # flake retry cap 3
    → wrapper verdict:
      OK (0)                       → run ground-truth gate → if exit 0: DONE
                                                           → if exit != 0: iterate
      REAL_ERROR (13)              → run ground-truth gate → (same)
      DELIVERABLES_MISSING (15)    → run ground-truth gate → (same)
      FLAKE_EXHAUSTED (12)         → escalate WALLED_3X
      NO_DELIVERY_MARKER (11)      → escalate
      LINK_REGRESSION (14)         → escalate (Story-0-class)
      EMPTY_JSONL (10) / NO_TURN_COMPLETED (16) → escalate CODEX_CRASHED
      other                        → escalate UNKNOWN

    gate exit != 0 and iter < MAX:
      compose fix prompt from gate output tail → PROMPT for next iter
      (prompt includes: marker + env-rules + "fix these specific errors" + gate output + acceptance criteria)
    
    iter == MAX and still red:
      escalate MAX_ITERATIONS_EXHAUSTED

  write <stem>.impl-report.md with:
    - verdict (GREEN / MAX_ITERATIONS_EXHAUSTED / WALLED_3X / ...)
    - iterations used
    - final gate exit
    - CLI evidence (thread IDs, wrapper verdicts per iter, flake attempts preserved)
    - gate output tail
    - driver log
    - action note (relay | escalate)
  
  exit code:
    0  if GREEN
    20 if MAX_ITERATIONS_EXHAUSTED
    30 if any other escalation
```

The key insight: **the ground-truth `pnpm verify` run from bash is the authoritative "done" signal.** Codex's own reports, wrapper verdicts, and JSONL contents are all advisory. If gates pass, we're done regardless of what happened mid-session.

---

## Scripts

All live in `scripts/codex/`, version-controlled:

### `run-codex-with-retry.sh`

Inner wrapper. Runs a single `codex exec --json --dangerously-bypass-approvals-and-sandbox` session and delegates verdict to the completion checker. Retries only on `FLAKE_DETECTED` (verdict 12). Preserves flaky attempts as `<stem>.flake-attempt-N.jsonl` for audit. Default max retries: 3 (= 2 relaunches after initial; Story 1 evidence shows this is the right floor).

**Don't invoke this directly.** The driver calls it. If you call it by hand you skip the outer gate-failure iteration loop and reintroduce the Story 1 gap.

### `check-codex-completion.sh`

Ground-truth checker. Reads a JSONL and produces a verdict + a human-readable `<stem>.completion-report.txt`. Verdict codes (stable contract):

| Exit | Verdict | Meaning |
|------|---------|---------|
| 0  | OK | All gates passed (prompt delivered, no flakes, no real errors, deliverables present, no link: regressions) |
| 10 | EMPTY_JSONL | Prompt never reached Codex (usually `/tmp/` path divergence on Windows — finding 004) |
| 11 | NO_DELIVERY_MARKER | Marker absent; prompt delivery failed or Codex skipped the echo |
| 12 | FLAKE_DETECTED | One or more commands hit `-1073741502` with empty output; wrapper retries |
| 13 | REAL_ERROR | Non-flake command failures present; don't retry blindly — check ground-truth gates first (driver does this) |
| 14 | LINK_REGRESSION | `package.json` contains `link:` deps — Story-0-class failure; reject |
| 15 | DELIVERABLES_MISSING | Codex reported completion but expected paths absent |
| 16 | NO_TURN_COMPLETED | Codex crashed before finishing a turn |

### `drive-until-green.sh`

**The only script the teammate runs.** Wraps `run-codex-with-retry.sh` with the outer iteration loop + ground-truth gate checks + fix-prompt composition + auto-report generation. Exit codes:

| Exit | Verdict | Teammate action |
|------|---------|-----------------|
| 0  | GREEN | Relay `<stem>.impl-report.md` via SendMessage; story is implementation-complete |
| 20 | MAX_ITERATIONS_EXHAUSTED | Escalate to team-lead; routine fix iteration exhausted, human judgment needed |
| 30 | NON_ROUTINE_FAILURE | Escalate with the specific verdict (WALLED_3X, NO_DELIVERY_MARKER, LINK_REGRESSION, CODEX_CRASHED, ...) |
| 40 | INTERNAL | Bad args / missing scripts (not a Codex problem) |

### `compose-prompt.sh`

Assembles a full Codex prompt from three parts: the delivery marker line, the canonical `env-rules.txt` block, and the story-specific task section. Use this for every initial prompt so the harness contract isn't re-authored per session.

### `env-rules.txt`

The canonical 9-rule environment block that must prepend every Codex prompt. Single source of truth — update here, not in per-story prompt files. Rules:

0. Delivery-check marker first (finding 004).
1. Workspace-only reads (finding 001).
2. Direct pnpm binary; no corepack (finding 001).
3. Abort on install failure; never emit `link:` (finding 001).
4. apply_patch → full-file-write fallback (finding 001).
5. Trust filesystem, not Codex self-reports (finding 005).
6. Clean up lockfile backups (finding 001).
7. APPEND, do not replace, on "additions to" deliverables (Story 0 finding #6).
9. Per-command flake retry for `-1073741502` empty output (finding 006).
9b. Session-wall short-circuit if first 3 commands all flake (finding 009).

---

## Prompt composition

The task section (the story-specific part of the prompt) follows a stable structure:

```
# Story N — <Title>

## Context
<what you're reading, paths to the key artifacts>

## Deliverables
<explicit list with exact file paths, mirror the DoD>

## Non-obvious constraints for this story
<scope boundaries, APPEND-vs-replace rules, deferred pieces for later stories>

## Acceptance
Run the following in order; both must exit 0 before declaring done:
  pnpm red-verify
  pnpm verify
(cumulative test count expected: N)

## Report before declaring done
<what Codex should include in its final agent_message>
```

Pipe this through `compose-prompt.sh` and the marker + env-rules prepend automatically.

---

## Teammate usage — exact steps

The implementer (or reviewer) teammate does exactly this, no improvisation:

### 1. Read artifacts sequentially with reflection

Per the materialized template in `team-impl-log.md` §Materialized Handoff Templates. Write reflections to `C:/Users/dsavi/AppData/Local/Temp/reflection-story-N.md`.

### 2. Author the task section

Write `C:/Users/dsavi/AppData/Local/Temp/story-N-task.md` using the structure above. The env-rules + marker get prepended by `compose-prompt.sh` in the next step.

### 3. Compose the full prompt

```bash
scripts/codex/compose-prompt.sh \
  C:/Users/dsavi/AppData/Local/Temp/story-N-task.md \
  C:/Users/dsavi/AppData/Local/Temp/codex-story-N-impl-prompt.md
```

### 4. Drive to green

```bash
scripts/codex/drive-until-green.sh \
  C:/Users/dsavi/AppData/Local/Temp/codex-story-N-impl-prompt.md \
  C:/Users/dsavi/AppData/Local/Temp/codex-story-N-impl \
  --gate "pnpm red-verify && pnpm verify" \
  --expect-path /c/github/streaming-control-panel/apps/panel/server/src/server/buildServer.ts \
  --expect-path /c/github/streaming-control-panel/apps/panel/server/src/server/registerRoute.ts \
  --link-grep-glob '/c/github/streaming-control-panel/apps/*/package.json' \
  --link-grep-glob '/c/github/streaming-control-panel/package.json'
```

Add one `--expect-path` per deliverable you want the checker to verify lands. Add one `--link-grep-glob` per package.json location you want scanned for `link:` regressions.

### 5. Handle the exit code

- **Exit 0 (GREEN):** `cat C:/Users/dsavi/AppData/Local/Temp/codex-story-N-impl.impl-report.md` and relay via SendMessage to team-lead. Work is done.
- **Exit 20 (MAX_ITERATIONS_EXHAUSTED):** SendMessage team-lead with the report path. The gate is still red after 4 attempts; human judgment needed on whether the scope/approach is off.
- **Exit 30 (NON_ROUTINE_FAILURE):** SendMessage team-lead with the report's verdict (WALLED_3X / NO_DELIVERY_MARKER / etc.) and the report path.
- **Exit 40 (INTERNAL):** Script args or environment problem. Fix the invocation and rerun.

You do not need to compose a report. You do not need to decide whether to retry. You do not need to manually parse JSONL. The driver owns all of that.

---

## Anti-patterns to avoid

1. **Don't run `codex exec` directly.** Always go through `drive-until-green.sh`.
2. **Don't use `codex exec resume`.** Fresh exec for every attempt (finding 009 — session walls are session-properties, only a new process clears them).
3. **Don't manually retry per-command when the session is walled.** The short-circuit (rule 9b) in the env-rules block handles this; don't burn turn budget on Rule 9 retries during a wall.
4. **Don't use `/tmp/` paths.** Always `C:/Users/dsavi/AppData/Local/Temp/...` (finding 004).
5. **Don't compose the §Step 6 report from memory.** Let `drive-until-green.sh` emit it; relay verbatim.
6. **Don't trust Codex's `agent_message` as the done signal.** Ground truth is the `pnpm verify` exit code, run from the teammate's bash after the session — which the driver does automatically.
7. **Don't accept a session with `NO_DELIVERY_MARKER`.** It means the prompt didn't land; the findings are Codex flailing on an empty input.
8. **Don't skip the env-rules block.** Every prompt gets it — including fix-round prompts. `compose-prompt.sh` enforces this.

---

## Troubleshooting

If `drive-until-green.sh` exits non-zero, the report's verdict tells you what to do:

| Verdict | Diagnosis | Action |
|---------|-----------|--------|
| `WALLED_3X` | 3 consecutive sessions all walled. Rare — may indicate persistent Windows state corruption | Wait 5 min, reboot, or try one more manual exec with fresh everything. If still walled, this is beyond finding 009's pattern; escalate. |
| `NO_DELIVERY_MARKER` | Prompt didn't reach Codex | Check that the prompt file exists at the path you passed to the driver. Check that it's at `C:/Users/dsavi/AppData/Local/Temp/...` (not `/tmp/`). |
| `LINK_REGRESSION` | `package.json` has `link:` deps | Story-0-class. Check `grep -rn '"link:' apps/*/package.json package.json`. The env-rules block rule 3 should have prevented this — if it fired anyway, the rule is being ignored (prompt composition issue). |
| `CODEX_CRASHED` | Codex exited before completing a turn | Rerun; if it repeats, check `tasklist` for stale `codex.exe` processes and kill them before retrying. |
| `MAX_ITERATIONS_EXHAUSTED` | Gate still red after 4 iterations | Read the `impl-report.md`'s final gate output. The error is either (a) outside Codex's scope (architectural change needed), (b) a test/spec mismatch requiring human judgment, or (c) a dependency/tooling issue the env-rules don't cover. Escalate. |

---

## Relationship to prior findings

| Finding | What it documented | How this runbook addresses it |
|---------|-------------------|-------------------------------|
| 001 — Windows Codex sandbox | Restricted-token layer disables network | `--dangerously-bypass-approvals-and-sandbox` in the wrapper; env-rules #3 bans `link:` fallback |
| 004 — `/tmp/` path divergence | Write tool vs Git bash resolve differently | Runbook + scripts use `C:/Users/dsavi/AppData/Local/Temp/` exclusively |
| 005 — Codex workdir / Test-Path | CWD drift in combined PowerShell | Env-rules #5; ground-truth gate runs from driver bash, not Codex |
| 006 — Flake retry wrapper | Per-command STATUS_DLL_INIT_FAILED | Env-rules #9 (per-command retry); wrapper retries session on FLAKE_DETECTED |
| 007 — Working pattern | Proven-green compound pattern for Story 0 | This runbook supersedes 007's pattern with the driver loop layered on top |
| 008 — Standalone subagent trap | Orchestration (spawn teammates, not subagents) | Not harness-specific; runbook assumes teammate execution per team-impl-v2 |
| 009 — Session-wide walls | 100% flake rate from item_0 | Env-rules #9b; driver's 3-attempt cap preserves the finding-009 floor |
| Story 1 gap (A) — turn-budget exhaustion | Codex ends mid-fix | Driver outer loop; fix-prompt composition from gate output |
| Story 1 gap (B) — implementer silent | Teammate forgets to report | Driver auto-generates `impl-report.md`; teammate relays verbatim |

---

## Maintenance

- **Adding a new env-rule:** edit `scripts/codex/env-rules.txt` (single source of truth). Don't inline rules in per-story prompts.
- **Changing the flake signature:** edit `check-codex-completion.sh` (verdict classification) AND `env-rules.txt` (rules 9, 9b).
- **Adding a new verdict:** extend `check-codex-completion.sh` (new exit code + report text) and `drive-until-green.sh` (case arm for how to react).
- **Changing the gate command:** pass `--gate` explicitly to `drive-until-green.sh`. Default is `pnpm red-verify && pnpm verify`.

If you find yourself manually prodding Codex again, the runbook or the scripts are incomplete — file it as a finding in `docs/v2-findings/` and update the harness.
