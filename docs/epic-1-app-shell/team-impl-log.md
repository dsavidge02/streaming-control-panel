# Epic 1 — Team Implementation Log (v2)

**Skill:** `ls-team-impl-v2` (experimental — paired with `ls-tech-design-v2`)

**state:** `BETWEEN_STORIES` — Story 1 accepted and committed 2026-04-17 (commits `7c0446d` fix(story-0) deferred findings + `e65d7f5` feat: Story 1 — Fastify server + central route wiring). Cumulative test count: 11 (3 shared + 8 server). Ready to reload skill and spawn Story 2. Prior state `STORY_ACTIVE` (phase: reviewing); reviewer ACCEPT verdict 21 PASS + 1 NOTE; three Minor dispositions recorded in §Story 1 Pre-Acceptance Receipt.

**Story 0 retry started 2026-04-17** in a fresh Claude Code session under the updated Windows Codex Hardening. Prior rollback context preserved in §Process Notes. Story 0 deferred findings #1 (PATHS shape) and #2 (gateExempt filename) resolved in the restart session prep phase — see §Story 0 Pre-Acceptance Receipt dispositions.

---

## Run Metadata

| Field | Value |
|-------|-------|
| Epic | `docs/epic-1-app-shell/epic.md` |
| Tech design index | `docs/epic-1-app-shell/tech-design.md` |
| Server companion | `docs/epic-1-app-shell/tech-design-server.md` |
| Client companion | `docs/epic-1-app-shell/tech-design-client.md` |
| Test plan | `docs/epic-1-app-shell/test-plan.md` |
| UI spec | `docs/epic-1-app-shell/ui-spec.md` (present; in scope starting Story 5) |
| Stories root | `docs/epic-1-app-shell/stories/` |
| Coverage gate | `docs/epic-1-app-shell/stories/coverage.md` |
| Per-story prompts | **Not present** — teammates write CLI prompts from story + tech-design refs |
| Selected CLI | **Codex** (`codex-subagent`) |
| CLI model | `gpt-5.4` (inherited from `~/.codex/config.toml`) |
| CLI ping | `PONG` — verified before Story 0 |
| Git baseline | `c06d9f5 Initial commit` on `main`, clean working tree (ignoring `docs/`, `.claude/`, `.github/`, `braindump.md` untracked) |

## Verification Gates (Discovered)

Derived from `tech-design.md` §Verification Scripts (no `CLAUDE.md` / `AGENTS.md` in the repo yet; tech design is the authoritative policy source for Epic 1).

| Gate | Composition | When |
|------|-------------|------|
| `pnpm red-verify` | `format:check && lint && typecheck` | TDD Red exit, stubs can throw |
| `pnpm verify` | `red-verify && test` | **Story acceptance gate** (default) |
| `pnpm green-verify` | `verify && guard:no-test-changes` | TDD Green exit (first real cycle: Story 4) |
| `pnpm verify-all` | `verify && test:e2e` | **Epic acceptance gate** |

**Story 0 acceptance gate:** `pnpm red-verify` and `pnpm verify` — both listed in Story 0 DoD. `green-verify` is irrelevant until `.red-ref` exists (Story 4 onward).

**Epic acceptance gate:** `pnpm verify-all`. Playwright e2e activates in Story 5; Story 0 ships `scripts/test-e2e-placeholder.mjs` that exits 0 with a SKIP notice, keeping `verify-all` a real command from day one.

## Boundary Inventory

Derived from the epic's Out of Scope list and the architecture's external surfaces. Epic 1 deliberately stubs or defers every external boundary.

| Boundary | Status | Owning Story | Notes |
|----------|--------|--------------|-------|
| Twitch OAuth (`/auth/login`) | **stub** (501 NOT_IMPLEMENTED) | Story 2 (stub body) → Story 4 (Origin-gated path) → **Epic 2** (real flow) | Exempt from session gate; Origin-validated |
| Twitch OAuth callback (`/oauth/callback`) | **stub** (501 NOT_IMPLEMENTED) | Story 2 → **Epic 2** (real flow) | Path reserved; Twitch dev console must register `http://localhost:7077/oauth/callback` |
| Twitch Helix / EventSub | not started | Epic 3 / Epic 4a | No client in Epic 1 |
| OS keychain (`keytar`) | not started | Epic 2 | No secrets in Epic 1 |
| SQLite filesystem (userData) | integrated | Story 3 | `install_metadata` baseline only; no feature tables |
| Live SSE producers | **stub** (heartbeat only) | Story 2 (cadence) → Story 4 (auth gating) → Epic 4a (real producers) | Heartbeat every 15s |
| Electron shell | integrated | Story 7 | Native chrome; `app://panel` protocol |
| GitHub Actions CI | partially integrated | Story 9 | `ci.yml` already exists in docs-only fallback mode; flips to pnpm when Story 0's root `package.json` lands |
| Session cookies (`iron-session`) | not started | Epic 2 | `sealFixtureSession` helper installs in Story 4 for later use |

**Story 0 boundary impact:** none beyond the filesystem. Story 0 writes config files and one test file.

## UI Spec Scope

Present at `docs/epic-1-app-shell/ui-spec.md`. The spec carries reference analysis, 5-palette visual system, screen inventory, AC-to-screen/state map, state coverage, and the verification surface (Playwright screenshots).

**Story-level applicability** (from `coverage.md` + UI spec ownership pattern):

| Story | UI Spec In Scope? |
|-------|-------------------|
| 0 | **No** — foundation only; no renderer code |
| 1 | No — server-only |
| 2 | No — server-only |
| 3 | No — data layer |
| 4 | No — server-only |
| 5 | **Yes** — landing view, palette system, 17 baseline screenshots |
| 6 | **Yes** — router + placeholders + redirect flash |
| 7 | **Yes** — Electron shell + `app://` protocol renders the UI |
| 8 | Partial — packaged artifact launches to landing (re-verifies Story 5 visuals) |
| 9 | No — CI workflow |

Human visual-review gate kicks in at Story 5.

## Story Sequence + Dependency Chain

From `coverage.md` §Cross-Story Dependency Summary:

```
Story 0 → Story 1 → Story 2 → Story 4
              └──→ Story 3
Story 0 → Story 5 → Story 6 → Story 7 → Story 8
                          (needs Story 3 + 4 + 6)
Story 0 → Story 9  (parallelizable with Stories 1–8)
```

Story 0 starts first with no dependencies.

---

## Windows Codex Hardening

**Root cause identified 2026-04-17 after Story 0 rollback.** `~/.codex/config.toml` sets `[windows] sandbox = "unelevated"`, which applies a Windows restricted-token layer to every Codex child process. This layer:

- Causes ~9% of PowerShell launches to fail with `STATUS_DLL_INIT_FAILED` (exit `-1073741502`).
- Causes `apply_patch` / `file_change` items to crash env-level under some resume-session conditions.
- **Disables network access**, which silently forces Codex to fabricate workarounds like `link:`-dep declarations pointing at other local directories. This is the most dangerous failure because it passes internal gates but produces an unportable codebase. Story 0 was rolled back for exactly this reason.

**Isolated diagnostic (2026-04-17):** running the same commands under `--dangerously-bypass-approvals-and-sandbox` succeeded 3/3 with real output, real paths, and network access.

### MANDATORY — every `codex exec` invocation in this workflow

Every `codex exec` and `codex exec resume` call composed by an implementer or reviewer teammate MUST pass `--dangerously-bypass-approvals-and-sandbox`. This is non-negotiable until the upstream skill adds Windows handling (see `docs/research/ls-team-impl-windows-codex-findings.md` for the upstream feedback report).

**Canonical invocation shapes:**

```bash
# Initial exec
codex exec --json --dangerously-bypass-approvals-and-sandbox - < /tmp/codex-prompt.md \
  > /tmp/codex-out.jsonl 2>/dev/null

# Resume (self-review loops, fix rounds)
codex exec resume --json --dangerously-bypass-approvals-and-sandbox --last \
  "self-review prompt ..." > /tmp/codex-review.jsonl 2>/dev/null
```

The flag is required because:
- Codex on Windows wraps every shell command in PowerShell internally, regardless of what the prompt asks for. Prompt-level "prefer bash commands" rules cannot bypass this.
- The restricted token + network disable is the friction source, not specific commands. Only the flag removes it.
- Risk for this workflow is acceptable: project `trust_level = "trusted"` is set explicitly; all prompts are internally composed; the alternative (status quo) produced silent correctness failures.

### Prompt preamble (short form, now that the flag handles the sandbox)

Every Codex prompt should still prepend this compact rules block:

```
=== ENVIRONMENT RULES ===

1. Working directory only — never scan C:\github, C:\Users, or any directory
   outside C:/github/streaming-control-panel. The artifact paths in the epic /
   tech design / story are all you need. Recursive cross-repo scans time out
   and waste budget.

2. Use the npm registry for dependencies — never use `link:` paths. Install
   packages from the registry via `pnpm install` with declared semver ranges.

3. If `apply_patch` fails for any file, fall back to rewriting that file in
   full via a single write. Do not retry apply_patch for the same file.

4. Delete transient `pnpm-lock.yaml.<digits>` backup files before finishing —
   only `pnpm-lock.yaml` itself should remain.
```

Re-evaluate the flag requirement at Epic 1 completion; expected to persist for the entire Windows Epic 1 run and likely all subsequent epics on this machine.

---

## Materialized Handoff Templates

Codex-side mechanics — invocation shape, env-rules block, flake/wall handling, fix-iteration loop — now live in **[`docs/codex-harness.md`](../codex-harness.md)** and the scripts at **`scripts/codex/`**. Read the runbook first; it is the single source of truth for *how to run Codex*. The templates below carry only the team-impl-v2-specific instructions: what the supervising teammate reads, how they dispatch Codex **through the harness**, and what they SendMessage back to team-lead. Re-read the runbook + these templates before each handoff.

### Non-Negotiable Invariants (summary)

All invariants below are enforced by `scripts/codex/env-rules.txt` + `scripts/codex/drive-until-green.sh`. They are listed here for quick reference; full rationale in the runbook.

1. `--dangerously-bypass-approvals-and-sandbox` on every `codex exec` (finding 001).
2. Prompt + JSONL paths live at `C:/Users/dsavi/AppData/Local/Temp/`, not `/tmp/` (finding 004).
3. Delivery-check marker `DELIVERY_CHECK_MARKER_ECHO_7077` prepends every prompt and is grepped before trusting output (finding 007).
4. Per-command `STATUS_DLL_INIT_FAILED` flakes retry up to 3× with 2s delay (finding 006 / rule 9).
5. Session-wide walls (first 3 commands all `-1073741502` empty) short-circuit and relaunch on a fresh `codex exec` process; wrapper cap is 3 total attempts (finding 009 / rule 9b).
6. Ground-truth gates run from the teammate's bash after Codex exits — `drive-until-green.sh`'s `--gate` command is the authoritative "done" signal, NOT Codex's self-report.
7. APPEND, do not replace, on any "additions to existing file" deliverable (Story 0 finding #6; rule 7 in env-rules.txt).
8. Orchestrator pre-accept runs `git diff --stat` across ALL touched paths (not just declared deliverables) to catch overwrite regressions.

### Implementer Template

```
You are implementing Story {N} on team epic-1-app-shell. You supervise Codex
via the harness; you do NOT implement directly. The runbook at
`docs/codex-harness.md` is your source of truth for Codex invocation —
read it before proceeding.

Step 1 — Load codex-subagent skill:
  Skill({codex-subagent})
  If the skill fails to load, report the error. Do not implement yourself.

Step 2 — Read artifacts sequentially with reflection.
  Write cumulative reflections to
    C:/Users/dsavi/AppData/Local/Temp/reflection-story-{N}.md
  before launching anything.

  Reading order:
    1. docs/epic-1-app-shell/tech-design.md             (index + cross-cutting)
    2. {primary tech-design companion(s) for this story}
    3. docs/epic-1-app-shell/test-plan.md               ({Story N} chunk)
    4. docs/epic-1-app-shell/epic.md                    (overall context)
    5. docs/epic-1-app-shell/stories/{NN-slug}.md       (THIS story — ACs/TCs/DoD)
    6. docs/epic-1-app-shell/stories/coverage.md        (confirm AC ownership)
    7. docs/epic-1-app-shell/ui-spec.md (ONLY if story is in UI-spec scope
       per §UI Spec Scope — Stories 5, 6, 7, partial 8)

Step 3 — Author the task section.
  Write C:/Users/dsavi/AppData/Local/Temp/story-{N}-task.md using the
  structure documented in docs/codex-harness.md §Prompt composition.
  Do NOT include the env-rules block or delivery marker — compose-prompt.sh
  prepends those. The task section must:
    - Enumerate explicit deliverables (exact paths, mirror the DoD fully)
    - Flag APPEND-vs-replace constraints on any pre-existing files
    - Specify the cumulative test count expected after this story
    - Name any deferred-to-later-story scope boundaries

Step 4 — Compose the full prompt:
  scripts/codex/compose-prompt.sh \
    C:/Users/dsavi/AppData/Local/Temp/story-{N}-task.md \
    C:/Users/dsavi/AppData/Local/Temp/codex-story-{N}-impl-prompt.md

Step 5 — Drive Codex to green:
  cd /c/github/streaming-control-panel
  scripts/codex/drive-until-green.sh \
    C:/Users/dsavi/AppData/Local/Temp/codex-story-{N}-impl-prompt.md \
    C:/Users/dsavi/AppData/Local/Temp/codex-story-{N}-impl \
    --gate "pnpm red-verify && pnpm verify" \
    {--expect-path /c/github/streaming-control-panel/<each-deliverable>}... \
    --link-grep-glob '/c/github/streaming-control-panel/apps/*/package.json' \
    --link-grep-glob '/c/github/streaming-control-panel/package.json'

  The driver handles: flake retry (cap 3), session-wall recovery,
  ground-truth gate check after every Codex exit, fix-prompt composition
  from gate output, outer iteration (cap 4), and §Step 6 report generation.
  You do NOT compose fix prompts. You do NOT decide whether to retry.
  You do NOT parse JSONL.

Step 6 — Handle the exit code:
  Exit 0  → cat the auto-generated report and SendMessage team-lead:
              cat C:/Users/dsavi/AppData/Local/Temp/codex-story-{N}-impl.impl-report.md
            That IS your §Step 6 report — relay verbatim, don't compose
            your own.
  Exit 20 → MAX_ITERATIONS_EXHAUSTED. SendMessage team-lead with the report
            path + verdict; routine fixes exhausted; human judgment needed.
  Exit 30 → NON_ROUTINE_FAILURE (WALLED_3X, NO_DELIVERY_MARKER,
            LINK_REGRESSION, CODEX_CRASHED, ...). SendMessage with verdict
            and report path.
  Exit 40 → Script / environment issue; fix the invocation and rerun.

Reminders:
  - No SendMessage composed from memory — the report file is the handoff.
  - Send team-lead a one-line status update every 10 minutes of elapsed
    driver time even if nothing's done yet.
  - If you find yourself running `codex exec` directly instead of via the
    driver, STOP — the harness exists precisely to prevent that.
```

### Reviewer Template

```
You are reviewing Story {N}'s implementation on team epic-1-app-shell. You
MUST run a Codex spec-compliance review via the harness AND a parallel
architectural review of your own. Source of truth for Codex invocation:
docs/codex-harness.md.

Step 1 — Load codex-subagent skill:
  Skill({codex-subagent})
  No CLI session, no review. Do not substitute your own compliance check.

Step 2 — Read artifacts sequentially with reflection (same order as
  implementer; include ui-spec.md when applicable). Write reflections to
  C:/Users/dsavi/AppData/Local/Temp/reflection-review-story-{N}.md

Step 3 — Launch Codex review via the harness.
  Author review task at:
    C:/Users/dsavi/AppData/Local/Temp/story-{N}-review-task.md
  describing what to check:
    - AC / TC coverage vs story + test-plan
    - Interface compliance vs tech-design companions
    - Scope boundary check (no Story N+1 creep)
    - Pre-existing-file regression check (`git diff <file>` for any file
      the story claims to modify)
    - `grep -rn '"link:' apps/*/package.json package.json` → empty
    - For UI-scope stories: component/state coverage per ui-spec;
      screenshot artifacts produced
    - Severity-organized findings (Critical / Major / Minor)
    - Write findings INCREMENTALLY to
      C:/Users/dsavi/AppData/Local/Temp/codex-story-{N}-findings.md
      as each criterion is verified (Story 0 finding #5 mitigation — long
      review sessions can exhaust turn budget before the consolidated
      message).

  Compose + drive (review mode — don't auto-iterate on gate failures;
  reviewer surfaces fixes, doesn't own them):

    scripts/codex/compose-prompt.sh \
      C:/Users/dsavi/AppData/Local/Temp/story-{N}-review-task.md \
      C:/Users/dsavi/AppData/Local/Temp/codex-story-{N}-review-prompt.md

    scripts/codex/drive-until-green.sh \
      C:/Users/dsavi/AppData/Local/Temp/codex-story-{N}-review-prompt.md \
      C:/Users/dsavi/AppData/Local/Temp/codex-story-{N}-review \
      --gate "pnpm red-verify && pnpm verify" \
      --max-iterations 1

  (--max-iterations 1 runs Codex once + the ground-truth gate once, then
  reports. Reviewer surfaces findings; fixes get routed to a fresh driver
  invocation with a fix task if needed.)

Step 4 — In parallel with Codex: do your own architectural review.
  - Does the implementation match the tech-design's vocabulary and shape?
  - Any premature abstraction / YAGNI violation?
  - Drop-in readiness for the next consumer (check coverage.md
    §Cross-Story Dependency Summary)?
  - UI spec compliance when applicable: components named, states reachable,
    screenshot artifacts produced per the verification surface.

Step 5 — Consolidate + route fixes (if any).
  Read Codex's incremental findings file + your architectural pass. Merge.
  Verify claims against actual code — common hallucination vectors:
  @panel/shared imports, tuple type names.

  If fixes are needed, route them via a NEW driver invocation with a fix
  task — do NOT implement yourself. Use `drive-until-green.sh` the same
  way the implementer did; you're the caller this time.

Step 6 — Report to orchestrator via SendMessage:
  - Codex review session ID(s) (from the driver's impl-report.md)
  - Delivery-check marker observed (REQUIRED)
  - Wall detected / relaunch count (from the driver report)
  - Your architectural findings
  - Codex findings (pointer to codex-story-{N}-findings.md)
  - What was fixed / what remains open (fixed / accepted-risk / defer)
  - Final pnpm red-verify + pnpm verify exit codes (orchestrator reruns
    authoritatively as part of acceptance)
  - UI spec compliance status (when applicable)
  - "What else did you notice but did not report?"
```

3. **Delivery-check marker.** Every Codex prompt prepends `FIRST THING: echo DELIVERY_CHECK_MARKER_ECHO_7077 before anything else.` After Codex exits, `grep DELIVERY_CHECK_MARKER_ECHO_7077 <output.jsonl>` before trusting any Codex report. No match = Codex received an empty or garbled prompt; the run's "findings" are Codex flailing.

4. **Environment rules preamble.** Every Codex prompt appends the env-rules block (below) immediately after the marker line.

5. **Rule 9 per-command flake retry.** Inside the env rules: if a single command exits with `exit_code == -1073741502` AND empty stdout/stderr, retry up to 3× with 2s delay. Signature is Windows `STATUS_DLL_INIT_FAILED` on PowerShell spawn; surgical; never fires on real failures.

6. **Wrapper-level relaunch cap = 3 total attempts (initial + 2 relaunches).** Implementer side: after Codex exits, scan the final JSONL for any command with the flake signature that survived rule 9. If any found, relaunch the whole session with fresh `exec` (not `resume` — resume sessions cluster-flake worse than fresh). Cap at 2 relaunches (so max 3 total attempts); escalate to the orchestrator beyond that. Story 1 evidence (see `docs/v2-findings/009-session-wide-codex-flake-walls.md`) showed two consecutive walled sessions before a clean third — the 3-attempt floor is what escapes the wall, not a loose upper bound. Capture walled-attempt JSONLs separately (e.g., `<out>.walled-attempts-raw-invocation.jsonl`, `<out>.flake-attempt-<N>.jsonl`) for audit.

6b. **Session-wall short-circuit (finding 009).** Distinct from per-command flakes: if the first 3 consecutive commands of a Codex session all fail with `-1073741502` empty output AND the commands are heterogeneous (not the same command retried), the whole session is walled — PowerShell-spawn subsystem is corrupt for that Codex process. Abort the session immediately; do NOT continue burning Rule 9 retry budget. Only a fresh `codex exec` (new process) can clear it. Kill stale `Codex.exe` processes before relaunching to avoid accumulating abandoned sessions.

7. **Append vs replace phrasing.** Any deliverable described as "additions to" or "extensions of" an existing file (e.g., `.gitignore` entries, README sections, package.json script additions) must say verbatim in the prompt: `APPEND — do not replace; preserve all existing content.` Story 0's `.gitignore` was nearly wiped because this was implicit.

8. **Orchestrator pre-accept structural check.** Before accepting any story, the orchestrator runs `git diff --stat` across ALL touched paths — not just declared deliverables — to catch overwrite regressions. This is in addition to the story acceptance gate.

### Orchestrator Pre-Acceptance Checklist

Before writing the transition checkpoint and committing, run these from
bash yourself (not delegated):

1. **Story gate** — `pnpm red-verify` then `pnpm verify`; both exit 0.
2. **Dep graph** — `grep -rn '"link:' apps/*/package.json package.json` returns empty.
3. **Pre-existing-file regression** — `git diff --stat` across ALL touched paths. Any file not declared as a deliverable that appears anyway? Any file declared as "additions to" that shows as wholly replaced? Investigate before acceptance. This check caught Story 0's `.gitignore` near-miss at the pre-commit gate.
4. **Cumulative test delta** — expected vs observed. Regression is a stop-the-line event per skill §Story Transition.
5. **Delivery-check marker** — grep every Codex JSONL for the marker. Missing marker in any run = the run's output is not trustworthy.
6. **Boundary inventory** — any external dependency that should have advanced this story still stub/not-started? Update §Boundary Inventory.
7. **UI spec** (when applicable) — screenshot artifacts present at expected paths; surface them for human visual review before acceptance.

---

## Process Notes

**2026-04-17 · Team creation correction.** Initial Story 0 implementer was spawned via `Agent` without team membership — a standalone subagent rather than a teammate on a persistent team. User caught this. Created team `epic-1-app-shell` (lead: `team-lead@epic-1-app-shell`). Team persists across all 10 stories; teammates cycle per story. Config: `~/.claude/teams/epic-1-app-shell/config.json`; tasks: `~/.claude/tasks/epic-1-app-shell/`.

**2026-04-17 · First implementer hit Bash permission denial on `codex`.** The orphaned subagent reported Bash tool refused all `codex` invocations even though the orchestrator's own Codex ping (`PONG`) worked from the same repo. The teammate escalated cleanly (retried 3+ shapes, did not substitute its own implementation — exactly the contract behavior). Hypothesis: subagents spawned without team membership inherit a stricter permission posture than teammates spawned via the team. Verified fix: respawning as a teammate with `bypassPermissions` mode worked — Codex ping and full exec ran clean.

**2026-04-17 · Idle-notification pattern clarified.** Two failure-adjacent patterns observed: (1) rapid idle bursts (3-4 within 10s) immediately after spawn indicate the `Agent` tool's `prompt` field didn't auto-deliver to a team-spawned teammate's mailbox — SendMessage the task explicitly; (2) periodic idles during active work are conversation-turn boundaries fired each time the teammate messages back, even while background processes (Codex exec, long `pnpm install`) continue. Neither is a reliable stopped signal. Saved to global memory `feedback_team_idle_notifications.md`.

**2026-04-17 · Windows Codex environment failures measured.** Story 0 impl JSONL (248 events, 558KB) showed 10/106 PowerShell launches crashing with STATUS_DLL_INIT_FAILED (`-1073741502`) and 9/106 recursive searches timing out (exit 124). Self-review FIX session had both `apply_patch` `file_change` items crash with the same env-level error — zero fixes landed. Root cause: `~/.codex/config.toml` sets `[windows] sandbox = "unelevated"`, which applies a Windows restricted-token layer to Codex subprocesses.

**2026-04-17 · Story 0 ROLLED BACK — silent dep-graph corruption.** Orchestrator file-state spot-check caught the real failure: the initial Story 0 scaffolding wrote `package.json` files with `link:` dependencies pointing to other machine directories (`link:C:/github/liminal-build/node_modules/@biomejs/biome`, `link:C:/Users/dsavi/AppData/Roaming/npm/node_modules/typescript`, `link:C:/github/liminal-build/node_modules/vitest`, `link:C:/github/liminal-spec/node_modules/zod`). Not portable: CI breaks, other devs break, any external-dir change breaks the project. Root cause same as above — the Windows sandbox disables network access, so `pnpm install` from the npm registry failed silently, and gpt-5.4 autonomously worked around it by linking to packages it found via recursive `C:\github` scans. Internal gates passed locally because the linked packages existed. This failure mode would not have been caught by the story acceptance gate alone — it required a structural dep-graph check.

**2026-04-17 · Windows hardening revised to sandbox-bypass.** Isolated test of `--dangerously-bypass-approvals-and-sandbox` showed 3/3 clean command execution with real paths and working network. Updated the §Windows Codex Hardening section to make the flag mandatory on every `codex exec` and `codex exec resume`. The long anti-PowerShell preamble has been replaced with a short 4-rule environment block (workspace-scoped reads, no `link:` deps, apply_patch full-file fallback, clean up lockfile backups). Trust tradeoff acceptable for this workflow: project is `trust_level = "trusted"`, prompts are internally composed, gpt-5.4 alignment is solid; the alternative produced silent correctness failures. Finding written up in `docs/research/ls-team-impl-windows-codex-findings.md` for upstream maintainers. Both templates updated. Cumulative test count reset to 0 (Story 0 not accepted). Fresh Claude Code session will restart Story 0 from clean baseline.

**2026-04-17 · Story 1 impl attempt 1 — full-session PowerShell spawn wall; orchestrator auto-response-collection needs refinement.** First Codex `exec` for Story 1 (session `019d9c45-a893-7b30-bd62-d72c6ddcc65f`, prompt `C:/Users/dsavi/AppData/Local/Temp/codex-story-1-impl-prompt.md`, 18KB with delivery marker + env rules + 11 deliverables) exited cleanly from a wrapper perspective (no exception, 31 JSONL events) but EVERY command in the session — 12/12 — failed with `exit_code -1073741502` STATUS_DLL_INIT_FAILED and empty stdout/stderr. Codex contractually aborted (did not fabricate, did not emit `link:` fallbacks — exactly the hardened behavior we wanted) and its final `agent_message` correctly said "blocked." A standalone `codex exec "ping"` immediately afterward returned `pong` cleanly (session `019d9c4c-7d96-7431-a4b3-c2d98a7e594d`), so the spawn environment recovers per-session — this was a whole-session cold-start wall, not a transient per-command flake.

**Refinement needed before any future wrapper claims "auto-collect Codex response":**

1. Rule 9 / flake-retry today assumes per-command independence. It does not handle a full-session spawn wall where EVERY command flakes from turn 0. The template's wrapper-level relaunch cap (2) is the correct mechanism — but the orchestrator needs to detect this failure shape deterministically, not by reading the final agent message (which is what caught it this time — pure luck the model phrased it as "Blocked").

2. **Deterministic detection heuristic to add to templates:** after Codex exits, if `(commands_with_flake_signature / total_commands) > 0.9` AND `total_commands >= 3`, treat the session as `SESSION_WALLED` and auto-relaunch with fresh exec. Do NOT read the `agent_message` text for this decision — string-matching on "Blocked" or similar is fragile across model responses.

3. **`codex-result`'s `last` extractor is not enough** for status decisions. We need a `codex-result status` that returns a structured verdict: `{ marker_present, commands_total, commands_flake_signature, commands_exit_zero, final_turn_has_agent_message }`. The wrapper composes its decision from that struct, not from prose.

4. **The orchestrator's own "wait for Codex" loop has no polling contract.** Today's model: launch as `run_in_background: true` and wait for the Claude-Code notification. That notification fires on process exit, but the orchestrator cannot distinguish "exited because task complete and green" from "exited because session-walled" without reading the JSONL. That's fine as long as the post-exec verification sequence runs unconditionally — which it does today — but it means every claim of "Codex reported green" is a two-step: (a) Codex's final message says green, AND (b) the orchestrator's own bash gates (`pnpm red-verify`, `pnpm verify`, `grep link:`, `git diff --stat`) pass. No single-step "Codex auto-returned success" is trustable. This is already in the template but the failure today makes the point concrete.

5. **Session-walled detection should pre-empt the self-review loop.** Today's templates have the self-review round triggered by "after Codex's first pass reports green." If attempt-1 returns session-walled, we skip the self-review entirely and launch attempt-2 fresh. This is the right behavior but the template doesn't spell it out — worth adding.

Attempt 2 launched fresh exec (relaunch 1/2) with the same prompt; session `blfrd4cve` (wrapper ID). If attempt 2 also walls, attempt 3 is the last-chance relaunch before escalating to the user per the wrapper relaunch cap. Findings to carry forward post-Story 1 into `docs/v2-findings/` and the template rewrite.

---

## Story Cycle Log

(Filled per story — pre-acceptance receipts, transition checkpoints, cumulative test counts.)

### Pending baseline

Cumulative tests before Story 0: **0**. Expected after Story 0: **3** (all in `apps/panel/shared/src/errors/codes.test.ts`).

### Story 0 — Pre-Acceptance Receipt (2026-04-17)

**CLI evidence references.** Implementer sessions: `019d9b75-bc10-7522-88e8-dd3ac580d297` (attempt 2 empty-prompt flail — invalidated), `019d9bbe-...` (orchestrator ping), probe-v2 `019d9bd4-fa36-73b0-a6eb-68b6f178234a`, probe-v3 `019d9bd7-8412-7693-ab5a-d9ea1b1b8f2d`, story-0-v3-initial (flake on cmd 1, aborted), story-0-v3-attempt4 `019d9bec-b77b-72e0-9ee5-18234b652763` (4 commands, 3 mid-run flakes, aborted), story-0-v3-attempt5 (landed 14/14 files, biome.json failure), story-0-v3-resume-biomefix (4-in-a-row flake cluster, aborted, no edit). Reviewer Codex session: `019d9c0b-5515-75f1-be88-d73a8b28d44e` (198 commands, 0 flakes, terminated before consolidated findings message — reviewer's own Opus pass absorbed the missing consolidation).

**Top findings and dispositions (six Minor, zero Critical, zero Major — per story-0-reviewer):**

| # | Finding | Severity | Disposition | Reasoning |
|---|---------|----------|-------------|-----------|
| 1 | PATHS nested shape (`PATHS.live.events`) vs spec flat shape (`PATHS.liveEvents`) | Minor | **fixed** (2026-04-17 restart session, pre-Story-1) | Nested won. `tech-design-server.md` was internally inconsistent (auth/oauth nested, liveEvents flat); resolved by updating the spec at `tech-design-server.md:867` from `PATHS.liveEvents` to `PATHS.live.events`. Impl unchanged. Executed by the `story-0-deferred-fixes` teammate; gates re-green before Story 1 spawn. |
| 2 | Filename `gateExemptPaths.ts` vs spec `gateExempt.ts` | Minor | **fixed** (2026-04-17 restart session, pre-Story-1) | Spec (`tech-design-server.md` §Workspace Layout + code blocks) and `test-plan.md` (`gateExempt.test.ts`) both used `gateExempt.ts`; impl renamed via `git mv`. `apps/panel/shared/src/index.ts` export path updated. Executed by the `story-0-deferred-fixes` teammate; gates re-green before Story 1 spawn. |
| 3 | `errors/envelope.ts` consolidated into `errors/codes.ts` instead of separate file | Minor | **accepted-risk** | Consolidation is functionally fine (all exports reachable via `index.ts`). If preferred, tech-design §Workspace Layout can be updated to match the inlined shape at Epic 1 closure rather than splitting now. |
| 4 | Unused `baseSseEventSchema` export in `sse/events.ts` | Minor | **accepted-risk** | Harmless; a possible extension point for future SSE event types. Deleting now would be churn if Story 4a re-introduces it. |
| 5 | `biome.json` missing `$schema` key | Minor | **accepted-risk** | Ergonomic-only (editor validation). Functional behavior unaffected. Can add on first biome-config change in any later story. |
| 6 | `biome.json` `!docs/references` entry (out of strict Story 0 DoD scope) | Minor | **accepted-risk** | Pragmatic necessity — without it, pre-existing `docs/references/neo_arcade_palettes.jsx` trips `pnpm lint` and Story 0 cannot go green. Reviewer confirmed the exclusion is correct. Flagged here so Story 5 (which consumes `neo_arcade_palettes.jsx` as a visual reference but doesn't compile it) isn't surprised. |

No findings were routed for implementer rework — all six are either structural deferrals to Story 1+ or explicitly accepted. The reviewer's own independent `pnpm red-verify` + `pnpm verify` runs were green and matched both the implementer's and orchestrator's independent gate runs (triple confirmation).

**Exact story gate commands run by orchestrator (ground truth):**
- `pnpm red-verify` → exit 0 (23 files clean via biome; 3 packages clean via tsc)
- `pnpm verify` → exit 0 (3 tests green; server + client pass-with-no-tests)
- `grep -rn '"link:' apps/*/package.json package.json` → 0 matches (no dep-graph regression)

**UI spec compliance:** N/A for Story 0 (activates at Story 5).

**Open risks:** none blocking; six Minor deviations dispositioned above with their carry-forward venues identified.

### Story 0 Orchestration Observations (captured for post-acceptance template rewrite)

Today's Story 0 run surfaced three concrete findings that belong in the ls-team-impl-v2 skill's Windows Codex hardening, above and beyond the sandbox-bypass requirement already in the skill:

1. **`/tmp/` path divergence between Claude Code's Write tool and Git bash.** On Windows, Write resolves `/tmp/foo` → `C:\tmp\foo` and Git bash resolves `/tmp/foo` → `%TEMP%\foo`. Different directories. The first attempt-#2 "failure chain" (fabricated `ECONNREFUSED 127.0.0.1:9`, Corepack EPERM, `link:` fallback) was pure artifact of Codex receiving an empty prompt because the prompt file was written to Write's `/tmp/` and Codex's stdin read from bash's `/tmp/`. Mitigation: **all Codex prompt files must use `C:/Users/<user>/AppData/Local/Temp/<name>` forward-slash Windows absolute paths** — both tools resolve these identically. Upstreaming priority: high.

2. **Resume sessions cluster-flake more than fresh exec.** Fresh `codex exec` sessions in this run saw flake rates consistent with the documented ~9% STATUS_DLL_INIT_FAILED base rate. One `codex exec resume --last` session (the biome.json fix attempt) hit 4 consecutive flakes on four different file-read commands — probability ~0.0066% at the base rate. Strong signal that resume sessions inherit a worse process-spawn environment than fresh exec, not random. Mitigation suggestions: (a) prefer fresh exec for fix rounds when feasible; (b) widen rule 9's retry cap for resume sessions specifically; (c) add cluster-aware retry (e.g., "if 2 consecutive flakes, wait 10s then retry 3 more times"). Upstreaming priority: high.

3. **Delivery-check marker required.** Without a `DELIVERY_CHECK_MARKER_ECHO_<id>` sentinel that Codex must echo before doing any task work, the team-lead has no way to distinguish "Codex received a garbled/empty prompt" from "Codex received the prompt and the task produced these results." Including a marker in the env-rules block + grepping the JSONL before trusting any Codex report should be a default for every Codex invocation the skill produces. Upstreaming priority: medium.

4. **Codex's in-block `Test-Path` checks are unreliable.** When Codex wraps multiple statements in a single `-Command` PowerShell block (e.g., install + existence check + tail), the CWD does not reliably carry across statements. Probe-v3 showed this vividly: `pnpm add` succeeded and wrote files to disk, but a subsequent `Test-Path` in the same -Command block returned `false`. The ground truth is the filesystem, verified from bash by the implementer after Codex exits. Skill guidance should warn agents not to trust Codex self-reports of file existence. Upstreaming priority: medium.

5. **Long review sessions can exhaust turn-budget before emitting a consolidated findings message.** The reviewer's Codex session ran 198 verification commands (zero flakes — good) but terminated cleanly on turn-completion before emitting an `agent_message` with the organized findings. Codex had done the reading and the spot checks but never got to the synthesis step. Mitigation suggestions: (a) bound the review prompt scope more tightly; (b) instruct Codex to write findings to a file incrementally as it verifies each criterion, not buffer until the end. Upstreaming priority: medium.

6. **"Append vs replace" regression class — neither self-review nor dual review catches it.** Caught at the orchestrator's pre-commit gate on 2026-04-17, not by any earlier verification: Codex's Story 0 scaffold *replaced* the repo's 136-line `.gitignore` (which included `.env`, `.env.local`, and the usual Node/IDE/Electron exclusions) with its own 4-line file containing only the entries Story 0's DoD named. The implementer's self-check and the reviewer's dual review both passed — both are structured around "did the declared deliverables appear?" not "did Codex overwrite any pre-existing file in a way that lost content?" This would have committed a repo where the user's `.env` was no longer ignored. Fix was a pure `git checkout -- .gitignore` revert (the original already covered every entry Story 0 asked to add). Mitigations for the skill templates: (a) implementer verification step must include `git diff --stat` across untracked-vs-existing files (anything previously tracked should not appear as "Added" unless the DoD explicitly asks for it); (b) reviewer spec-compliance prompt must include "check for regressions in pre-existing files (esp. `.gitignore`, `.npmrc`, `README.md`, any config) — compare against HEAD"; (c) DoDs phrased as "additions" to an existing file should say "append — do not replace; preserve existing content" explicitly in handoff prompts. Upstreaming priority: high — this is a real security adjacency (un-ignored `.env` → accidental secrets commit).

All six are candidates for the **`docs/v2-findings/`** directory post-acceptance, with a handful likely worth an upstream report to the liminal-spec skill maintainers (similar to `docs/research/ls-team-impl-windows-codex-findings.md`).

### Story 0 — Transition Checkpoint (accepted + committed 2026-04-17)

**Cumulative test count after Story 0: 3** (all in `apps/panel/shared/src/errors/codes.test.ts`; baseline was 0). Story 1 expected to add Fastify-server tests — check `test-plan.md` Story 1 chunk for the expected delta and confirm the post-Story-1 total doesn't regress below 3.

**Problems encountered:** (i) fresh-session team recreation (the team directory didn't persist from the prior session); (ii) `/tmp/` path divergence between Write tool and Git bash on Windows, which caused attempt #2's entire failure chain; (iii) STATUS_DLL_INIT_FAILED Windows PowerShell-launch flake affecting ~9% of cold launches, with cluster behavior on `codex exec resume` (4-in-a-row observed); (iv) `biome.json` Biome-1.x schema mismatch requiring a manual fix after Codex's resume session flake-clustered; (v) `.gitignore` replace-instead-of-append regression caught at the orchestrator's pre-commit structural gate.

**Impact and resolution:** all mitigations landed in the materialized handoff templates (superseded for Story 0 retry; full rewrite for Story 1 pending — see below). Repo committed clean at `15b3c00`.

**Recommendations for Story 1** (all resolved in the 2026-04-17 restart session before Story 1 spawn):
- ~~Rewrite §Materialized Handoff Templates~~ → **done** (restart session). New §Materialized Handoff Templates section embeds: `C:/Users/dsavi/AppData/Local/Temp/` path convention; `DELIVERY_CHECK_MARKER_ECHO_7077` sentinel; rule-9 per-command flake retry (3× with 2s delay); wrapper-level whole-session retry for flake clusters (cap 2 relaunches); explicit "APPEND — do not replace" phrasing; structural pre-accept `git diff --stat` check across all touched paths.
- ~~Decide the PATHS shape~~ → **done** (restart session). Nested won; `tech-design-server.md:867` updated to `PATHS.live.events`.
- ~~Decide the `gateExemptPaths.ts` vs `gateExempt.ts` filename~~ → **done** (restart session). Renamed to `gateExempt.ts` (spec + test-plan alignment); `apps/panel/shared/src/index.ts` export path updated.
- ~~Rebind the team-lead slot~~ → **done** (restart session). Team `epic-1-app-shell` recreated on fresh session via `TeamCreate` (team directory is ephemeral across Claude Code sessions — captured in memory `reference_team_directory_ephemeral.md`).

**Restart-session orchestration observation (captured for v2-findings):** On fresh-session boot, the orchestrator reflexively tried to spawn the deferred-fixes worker as a standalone subagent (`Agent()` without `team_name`) instead of a teammate on `epic-1-app-shell`. User caught the mistake in real-time — same failure class as the original Story 0 "Team creation correction" (see §Process Notes 2026-04-17). Written up as `docs/v2-findings/008-standalone-subagent-trap.md`; project memory `feedback_always_spawn_as_teammate.md` now indexes the rule so future sessions don't repeat it. Also surfaced a corollary: `TaskCreate` calls made *before* `TeamCreate` land on a default/previous task list and return `Task not found` on later `TaskUpdate`; tasks must be recreated on the team list after `TeamCreate`.

**Boundary inventory (unchanged from §Boundary Inventory; Story 0 had no external-boundary deltas).** Twitch OAuth still stub (Story 2 → Epic 2), Helix/EventSub still not-started, keychain still not-started, SQLite still integrated only via `install_metadata` planning, SSE still stub-cadence (Story 2), Electron shell still not started, GitHub Actions CI still in docs-fallback mode (Story 0's root `package.json` now committed — Story 9 will flip the workflow to pnpm).

### Story 0 — attempt 2 (started 2026-04-17)

### Story 0 — attempt 2 (started 2026-04-17)

Fresh Claude Code session picked up at state `BETWEEN_STORIES` per RESTART-INSTRUCTIONS. On session boot:

- Team directory `~/.claude/teams/epic-1-app-shell/` was **not present** — the prior session's team did not persist across the Claude Code process boundary. Recreated via `TeamCreate` (team_name `epic-1-app-shell`, lead `team-lead@epic-1-app-shell`). The RESTART doc claim that the team persists is false on this machine; the log + updated templates persist, but the team itself has to be recreated each fresh session. Flagging for future Epic 1 sessions.
- Codex ping with the mandatory `--dangerously-bypass-approvals-and-sandbox` flag returned `PONG` cleanly — network + process execution confirmed working under the hardened invocation shape.
- Git baseline re-verified: `c06d9f5` on `main`, clean working tree (docs/, .claude/, .github/, braindump.md, CLAUDE.md untracked — all source docs, not Story 0 output).
- Fresh `story-0-implementer` teammate spawned on the rebuilt team; task delivered via `SendMessage` per the captured idle-notification pattern (the `Agent` tool's `prompt` field does not reliably auto-deliver on this machine).

**2026-04-17 14:23Z — MAJOR FINDING: attempt #2 failure chain is suspect; Claude vs Git-bash `/tmp/` path-mapping divergence on Windows.** The implementer traced the probe failure and uncovered that Claude Code's `Write` tool on Windows resolves `/tmp/<name>` to `C:\tmp\<name>` while Git bash resolves `/tmp/<name>` to `C:\Users\<user>\AppData\Local\Temp\<name>` (MSYS2 convention). The two paths are different directories. Every materialized handoff template in this log used `/tmp/` paths, meaning the implementer's Write of `/tmp/codex-story-0-prompt.md` landed in `C:\tmp\` (11,970 bytes), while `codex exec - < /tmp/codex-story-0-prompt.md` read from `C:\Users\dsavi\AppData\Local\Temp\` (0 bytes). **Codex received an empty prompt on attempt #2.** The `ECONNREFUSED 127.0.0.1:9`, Corepack EPERM, pnpm rename EPERM, and `link:`-dep fallback all came from Codex flailing with zero instructions — not from real environment constraints. The actual behavior of Codex under `--dangerously-bypass-approvals-and-sandbox` with a real prompt is currently unknown. **Path convention effective immediately: all prompt files use `C:/Users/dsavi/AppData/Local/Temp/<name>` (forward-slash Windows absolute). Never use `/tmp/` on this host — both Claude's Write tool and Git bash resolve forward-slash Windows paths identically.** A delivery-assertion marker (`DELIVERY_CHECK_MARKER_ECHO_7077`) is now prepended to probe/implementer prompts, with a bash grep of the output JSONL before trusting the run. Probe rerun dispatched under the fixed path.

**2026-04-17 14:30Z — Probe chain established clean Codex behavior under the bypass flag.** Probe-v2 confirmed delivery mechanism + abort-on-failure discipline; probe-v3 (with pre-created workdir) confirmed real network access — `pnpm add typescript@^5` exit 0, registry-sourced download, real node_modules on disk. No ECONNREFUSED, no Corepack EPERM, no `link:` deps when Codex has a real prompt and a defined workdir. Additional finding: Codex's combined-PowerShell-block wrapping can drop CWD context between statements, so its in-block `Test-Path` existence checks are unreliable (probe-v3 returned `exists: false` while the file was present on disk). Hardening update: treat Codex's self-reported disk state as advisory only; ground truth is verified by the implementer via independent bash `ls` / `grep` / gate runs after Codex exits. Story 0 attempt #3 dispatched with (a) path convention `C:/Users/dsavi/AppData/Local/Temp/<name>`, (b) delivery-check marker `DELIVERY_CHECK_MARKER_ECHO_7077`, (c) expanded 8-rule env block (no corepack; direct pnpm binary; abort-on-failure; no in-block Test-Path trust), (d) explicit independent ground-truth verification sequence. The current §Materialized Handoff Templates block is SUPERSEDED for Story 0 retry by the instructions sent via SendMessage — templates themselves will be rewritten post-acceptance before Story 1 spawns.

**2026-04-17 15:16Z — Implementer reported Story 0 green; transitioning to review phase.** Summary of how implementation closed: attempt 5 (wrapper + rule-9 per-command retry + absolute Windows paths + delivery marker) landed 14/14 deliverable files on disk with a clean `pnpm install` (48 packages from npm registry, 3.9s, zero `link:` paths). Story-gate failure surfaced at `format:check` because Codex wrote `biome.json` with Biome 1.x `files.ignore` schema rather than Biome 2's `files.includes`. Attempted to fix via `codex exec resume` (option B per team-lead directive) but that resume session hit a **4-in-a-row STATUS_DLL_INIT_FAILED flake cluster** — rule 9 retries exhausted, Codex aborted per rule 5 without making any edit. Implementer pivoted to option A (manual shell fix) and applied three changes: replaced `files.ignore` with `files.includes` using Biome 2 negation patterns; ran `pnpm format:fix` which reformatted 24 Codex-authored files (Codex wrote spaces; project prefers tabs); added `!docs/references` to the Biome includes list because `docs/references/neo_arcade_palettes.jsx` (pre-existing visual reference) tripped the linter and is not scaffold code. Final gates from implementer's bash: `pnpm red-verify` → 0, `pnpm verify` → 0 (3 tests green in `apps/panel/shared/src/errors/codes.test.ts`), `grep '"link:' package.json` → 0 matches. Implementer flagged the manual fix, the out-of-scope `!docs/references` addition, and the missed Codex self-review pass transparently in their receipt.

**Two orchestration findings captured for post-acceptance template rewrite:**

1. **Flake clustering on resume sessions.** Independent observations across today's run: fresh `codex exec` launches had low flake rates (probe-v2, probe-v3, story-0-v3-initial all cleared within 1-2 attempts each). The `codex exec resume` for the biome fix hit 4 consecutive STATUS_DLL_INIT_FAILED errors — probability ~0.0066% at the documented 9% base rate. Strong signal that resume sessions have materially worse flake characteristics than fresh exec, not random. Upstream-reportable.
2. **Rule 9's 3-retry cap is too low for cluster events.** Per-command retry at 3 attempts assumes flakes are independent. They're not when clustering kicks in. A higher cap (e.g., 5 with exponential backoff, or cluster-aware: "if 2 consecutive flakes, wait 10s and retry 3 more times") would likely have survived today's resume. Worth upstreaming.

Transition: implementer instructed to stand by (no file touches, no Codex); fresh `story-0-reviewer` teammate spawned for the dual (Opus architectural + Codex spec-compliance) review cycle. The missing Codex self-review pass is absorbed into the reviewer's CLI step; the manual biome.json fix + `!docs/references` addition + `format:fix` results will get externally verified as part of the reviewer's pass. Reviewer's Codex prompts will use the same Windows-path convention, delivery-check marker, and rule 9 that the implementer stabilized on.

**2026-04-17 14:14Z — Attempt #2 initial failure report (preserved — root-cause-reinterpreted above).** Codex session `019d9b75-bc10-7522-88e8-dd3ac580d297` ran once with the mandatory `--dangerously-bypass-approvals-and-sandbox` flag (network + writes confirmed working via the team-lead's independent PONG check). Codex failed during `pnpm install` with **three stacked environmental issues** that are independent of the original sandbox bug:

1. **Corepack EPERM**: `mkdir 'C:\Users\dsavi\AppData\Local\node\corepack\v1\corepack-...'` denied. Windows file-permission / lock issue on AppData, not sandbox.
2. **ECONNREFUSED 127.0.0.1:9** on `https://registry.npmjs.org/pnpm/-/pnpm-10.18.0.tgz`. Port 9 is the TCP discard port — outbound fetch is being redirected via an HTTP(S)_PROXY env var or an npmrc `registry=` override pointing at a sink. Not a sandbox issue.
3. **pnpm rename EPERM**: `node_modules\.pnpm\lock.yaml.3541965307 → lock.yaml`. Windows file-locking (Defender / OneDrive / indexer).

Codex's response to all three was to **fall back to `link:` deps** — the same regression class attempt #1 produced. Key update to our understanding: the `link:` fallback is NOT caused by the sandbox specifically. It is Codex's default recovery from any `pnpm install` failure. Sandbox-bypass alone does not prevent it — the installer has to actually succeed. Env preconditions must be verified before future Codex launches.

Repo state: pristine. The 26 files Codex claimed to write did not persist on the real FS (either Codex sandbox-overlay effects, or the rename EPERM rolled them back). `git status` is identical to pre-run.

Implementer escalated cleanly with session ID and a crisp failure chain — contract behavior (did not fabricate success, did not substitute own implementation). Team-lead authorized option A (shell-level read-only diagnostic) with a 15-minute time-box and strict no-mutation scope. User briefed on the stacked env issues in parallel — any config change (unsetting env vars, editing npmrc, Defender/OneDrive scope) requires user approval.

### Story 1 — Pre-Acceptance Receipt (2026-04-17)

**CLI evidence references** (3 impl Codex sessions + 1 reviewer session):

- Impl attempt 1 (walled) — thread `019d9c4c-bdb3-7f23-803e-c168fb0015e1`; JSONL `C:/Users/dsavi/AppData/Local/Temp/codex-story-1-impl.walled-attempts-raw-invocation.jsonl` (9KB). 100% flake wall from `item_0`; 5 consecutive heterogeneous commands all `-1073741502` empty. Codex diagnosed the wall, did NOT fabricate; aborted without writing. Evidence for Finding 009.
- Impl attempt 2 (walled) — thread `019d9c56-d940-7ab0-ab33-d5c7fb5cf660`; JSONL `codex-story-1-impl.flake-attempt-1.jsonl` (9KB). Same wall pattern. Codex emitted a clean `agent_message`: *"Blocked by the shell environment before any repo work could start… Files created: none."* No `link:` fallback, no fabricated successes. The env-rules block (§Abort-on-failure + no-`link:`) is load-bearing.
- Impl attempt 3 (successful) — thread `019d9c57-f90b-7f90-8448-b0f3c906b020`; JSONL `codex-story-1-impl.jsonl` (148KB). All 10 deliverables written; 7 intermediate `real_errs` (typecheck failures on missing `@types/node` + `registerRoute` type narrowing) caught and fixed in-session; 35 successful commands; final in-session `pnpm red-verify` + `pnpm verify` green. Completion-report verdict `REAL_ERROR` reflects intermediate failures, not final state — orchestrator's independent end-to-end gate run at acceptance time is the authoritative final-state signal.
- Reviewer Codex spec-compliance pass — thread `019d9c73-4236-7fc0-9903-8cd3dfe2aa5c`; JSONL `codex-story-1-review.jsonl` (240KB); incremental findings `codex-story-1-findings.md`. 22 criteria evaluated → 21 PASS + 1 NOTE-only. 0 flakes, 0 walls, 0 relaunches, delivery marker observed 2×. Token usage 3.72M input (3.64M cached — prompt cache warm from impl phase) / 17.2K output.

**Top findings and dispositions** (reviewer's consolidated list — zero Critical, zero Major, three Minor):

| # | Finding | Severity | Disposition | Reasoning |
|---|---------|----------|-------------|-----------|
| 1 | `ServerConfig.port: number` / `host: string` instead of tech-design's literal `typeof PANEL_PORT` / `typeof PANEL_HOST` | Minor | **accepted-risk** | Value behavior identical; loses only compile-time literal narrowing. Downstream consumers do not need the literal type. |
| 2 | `registerRoute.ts` reduces `spec.method` arrays to their first element for `stateMutating` classification | Minor | **defer** | No Story 1 route uses multi-method arrays; latent edge case. Tighten only if a future story registers mixed mutating/non-mutating methods in a single route spec (unlikely given Story 2 + 4 register per-method). |
| 3 | `databasePath` returns `process.cwd()` in `loadConfig()` instead of `app.getPath('userData')` | Minor | **defer — Story 3** | Story 3 implements `openDatabase` and will wire `resolveUserDataDbPath()` per tech-design-server.md §Server Binding. Story 1 threads `inMemoryDb` correctly; placeholder acceptable for Story 1 scope. |

Zero findings routed for implementer rework. Reviewer's independent `pnpm red-verify` + `pnpm verify` matched both Codex's and orchestrator's runs (triple confirmation). The implementer's §Step 6 report was never produced — reviewer proceeded cold (see §Story 1 Orchestration Observations below).

**Exact story gate commands run by orchestrator** (ground truth):
- `pnpm red-verify` → exit 0 (33 files clean via biome; 3 packages typecheck clean)
- `pnpm verify` → exit 0 (11 tests cumulative — 3 shared from Story 0 + 8 new server: 2 `buildServer` + 3 `registerRoute` + 3 `errorHandler`)
- `grep -rn '"link:' apps/*/package.json package.json` → 0 matches (no Story-0-class regression)
- `git diff --stat apps/panel/server/package.json` → only dependency additions (`fastify ^5.8.5`, `fastify-type-provider-zod ^6.1.0`, `zod ^4.3.6`, `@types/node ^24.12.2` as devDep); name/type/scripts preserved
- `git diff apps/panel/server/tsconfig.json` → no changes
- `git diff apps/panel/shared/src/index.ts` → only the Story 0 deferred-fix rename cascade (gateExemptPaths → gateExempt)

**UI spec compliance:** N/A for Story 1 (activates at Story 5).

**Open risks:** none blocking; three Minor deviations dispositioned above with their venues identified.

### Story 1 Orchestration Observations (captured for v2-findings + future handoffs)

1. **Session-wide Codex flake walls on attempts 1 and 2** — the central finding of this story. Codex's first two `codex exec` sessions hit 100% flake rates from `item_0` onward — every PowerShell spawn returning `-1073741502` with empty output, across heterogeneous commands (marker echo, sleep, read probes). This is *distinct* from the per-command ~9%-base-rate flake covered by Rule 9; it's a session-property corruption that only a fresh Codex process (NOT `resume`) can clear. The pre-existing wrapper cap of 2 relaunches was exactly on the edge of failure — Story 1 needed 3 total attempts to escape the wall, leaving zero slack. Full writeup: [`docs/v2-findings/009-session-wide-codex-flake-walls.md`](../v2-findings/009-session-wide-codex-flake-walls.md). Templates now carry a 3-attempt relaunch cap and a new Rule 9b that short-circuits walled sessions instead of burning per-command retry budget.

2. **"Agents forget to report back" — live-fire repeat, not just a Story 0 risk.** The Story 1 implementer finished work at 12:55 — all 10 files on disk, Codex's in-session iteration fixed the typecheck errors, final gates green per independent `pnpm verify` run. But the implementer never sent a `§Step 6` SendMessage. Orchestrator had to extract CLI evidence from on-disk JSONLs and proceed to the reviewer phase without an implementer handoff. Contributing factor: the wrapper's completion-report verdict was `REAL_ERROR` (counting 7 intermediate `real_errs` during the session), which likely misread as a failure by the implementer even though final state was green. The implementer template §Step 4 was updated post-hoc to require fresh-exec iteration when Codex ends with gate failures AND to add a 10-minute status-update cadence; neither fix retroactively helps Story 1, but both are in place for Story 2+.

3. **Completion-report verdict semantics are subtle.** The wrapper's `REAL_ERROR` verdict counts non-flake command failures *during* the session, not final-state disposition. Story 1's 7 intermediate typecheck failures (each Codex then fixed in-session) tripped the verdict even though end-state was green. Orchestrator-run `pnpm verify` is the authoritative final-state signal. Future wrapper iteration should distinguish `IN_SESSION_RECOVERED_FROM_ERRORS` (intermediate failures + green final gates) from `FINAL_STATE_FAILING` (session ended with open gate failures).

4. **Prompt caching is doing real work.** Reviewer's Codex pass used 3.72M input tokens with 3.64M cached — 97.8% cache hit rate against the impl phase's warm cache. Keep the reading-order consistent across stories within an epic; the savings compound.

5. **Codex's `agent_message` error quality during walled sessions was exemplary.** The attempt-2 final message: *"Blocked by the shell environment before any repo work could start. I did not guess file contents or rewrite files blind; that would violate the append-only and filesystem-truth constraints you set."* Codex cited the env-rules block reasoning in its own words. The block is doing real work; don't weaken it.

6. **Reviewer's "what else did you notice" surfaced several small positive observations** worth persisting: (a) the `app.decorate("config", ...)` + `declare module 'fastify'` seam is a clean hook for Story 4's session gate to access config; (b) `buildTestServer`'s careful destructure-and-remerge of `config` avoids a common override-wipe bug; (c) the `registerRoute` error message even tells the next reader which file to edit to add a path — unusually high-quality scaffold-era error text. None of these are blockers; all are signals that Codex produced real, idiomatic code once it escaped the wall.

### Story 1 — Transition Checkpoint (accepted + committed 2026-04-17)

**Cumulative test count after Story 1: 11** (3 shared from Story 0 + 8 new server: `buildServer.test.ts` 2 + `registerRoute.test.ts` 3 + `errorHandler.test.ts` 3). Story 2 should add tests for `/auth/login`, `/oauth/callback`, `/live/events` stubs per `test-plan.md`; after Story 2 the cumulative floor is ≥ 11 and the expected delta is documented in test-plan.md §Chunk Breakdown.

**Problems encountered:** (i) session-wide Codex flake walls on impl attempts 1 + 2 (Finding 009); (ii) implementer went silent post-completion without producing a §Step 6 report; (iii) tech-design didn't call out `@types/node` explicitly — Codex caught the TS2307/TS2580 errors via red-verify and added it during in-session iteration.

**Impact and resolution:** all three surfaced as v2-findings (008 from restart prep + 009 from Story 1) or as template hardening (§Non-Negotiable Invariant #6 bumped to 3-attempt cap; new #6b session-wall short-circuit; new Rule 9b in env-rules block; §Implementer Template Step 4 rewritten for failure-case iteration). Story 1 ships green; no regressions; boundary inventory unchanged (Story 1 had no external-boundary deltas).

**Recommendations for Story 2:**
- Story 2 handoff should note: `@fastify/cookie` + `iron-session` are NOT installed yet (Story 4). Story 2's route handlers (`auth.ts`, `oauthCallback.ts`, `liveEvents.ts`) import `AppError` + `PATHS` + `registerRoute` and throw `NOT_IMPLEMENTED` inside handlers.
- Story 2 tests (auth/oauthCallback/liveEvents) are partially authored with `.skip()` per `test-plan.md` Chunk 2; the skips come off in Story 4 when the real Origin + session preHandlers replace the stubs.
- If Story 2 implementer hits a session wall, skip Rule 9 per-command retries and go straight to a fresh-exec relaunch (up to 3 total attempts). Documented in templates.
- Warm cache inheritance: Story 2 Codex prompts should mirror Story 1's reading order verbatim so the 3.64M-token cached prefix carries over.

**Boundary inventory (unchanged from §Boundary Inventory; Story 1 had no external-boundary deltas).** Twitch OAuth stub status advances to "stub body present" in Story 2 (501 NOT_IMPLEMENTED); Helix/EventSub still not-started; keychain still not-started; SQLite still integrated only via `install_metadata` planning (Story 3); SSE stub cadence lands in Story 2; Electron shell still not started; GitHub Actions CI still in partial state (flips to pnpm at Story 9). Session-cookies boundary still not-started (Story 4 lands the real flow).
