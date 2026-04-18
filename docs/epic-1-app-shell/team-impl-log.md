# Epic 1 — Team Implementation Log (v2)

**Skill:** `ls-team-impl-v2` (experimental — paired with `ls-tech-design-v2`)

**state:** `BETWEEN_STORIES` — Story 6 accepted and committed 2026-04-17 in a fresh Claude Code session. Cumulative test count: **73 Vitest live (4 shared + 37 server + 32 client) + 17 Playwright baselines** (unchanged — redirect states already captured in Story 5 via testBypass). Story 6 delivered the client-side gate in 1 driver iteration: new files `src/app/{defineRoute.ts, routes.ts, router.tsx, RequireAuth.tsx}`, new placeholder views `src/views/{HomePlaceholder,SettingsPlaceholder}.tsx`, new 5-test file `src/app/router.test.tsx` (TC-2.1a/b/c + TC-2.5b + TC-2.6a); `src/App.tsx` MODIFY swapped `<Landing />` for `<RouterProvider router={router} />` preserving `<PaletteProvider>` wrapper. Dual review clean: 1 Minor (RequireAuth missing Epic 2 replacement comment from tech-design) accepted-risk and filed for pre-epic-verification cleanup. Incidental bonus: Codex's App.tsx rewrite removed an erroneous UTF-8 BOM that Story 5's implementer prepended (filed cleanup resolved naturally). Impl thread `019d9ea3-a22e-71e3-ba95-6ca535e15978`; review thread `019d9eac-5b3d-7010-9aa6-ad37f229be63`. Delivery markers: impl=2, review=3. Zero walls, zero relaunches. `.red-ref` rotated to Story 6's commit SHA post-commit; `pnpm green-verify` confirmed green. Prior accepted-and-committed: Story 0 (`15b3c00` + `7c0446d`) + Story 1 (`e65d7f5`) + Story 2 (`0e51796`) + Story 3 (`b4d578f`) + Story 4 (`9457d11`) + Story 5 (`4220836`).

**Previously: STORY_ACTIVE** — Story 6 started 2026-04-17 in a fresh Claude Code session. Phase: `reviewing` (impl GREEN iter 1, driver exit 0; cumulative test count: 73 Vitest live = 4 shared + 37 server + 32 client; 17 Playwright unchanged; impl thread `019d9ea3-a22e-71e3-ba95-6ca535e15978`). Team `epic-1-app-shell` persisted from prior session (TeamCreate reported already-leading; memory note `reference_team_directory_ephemeral` may be stale or session-scoped vs persistent). Implementer spawned as teammate `impl-story-6`. Story 6 gate per Story 5 transition recommendation: `pnpm red-verify && pnpm verify` (not green-verify). Target delta: +5 Vitest tests (68→73 live), zero new Playwright baselines (redirect states already captured via testBypass in Story 5). Key MODIFY flag: `apps/panel/client/src/App.tsx` currently mounts `<Landing />` as a direct child of `<PaletteProvider>` — Story 6 replaces that child with `<RouterProvider router={router} />` per tech-design-client §App Root. Any new e2e screenshots (none expected) must use `{ animations: 'disabled', fullPage: true }` per Finding 010.

**Previously: BETWEEN_STORIES** — Story 5 accepted and committed 2026-04-17 (human visual review passed after fix round 2). Cumulative test count: **68 Vitest live (4 shared + 37 server + 27 client) + 17 Playwright baselines**. Story 5 fix history: fix round 1 (Codex + Opus architectural dual review) caught 1 Critical + 3 Majors + 2 Minors — Critical downgraded to Major-accept-risk (test-plan feedback for pre-epic-verification cleanup; `authApi.ts` has no dedicated test by plan design), 3 Majors fixed (`usePalette` interface narrowed to `{ palette, setPalette }`, Google CDN removed from production `index.html`, 3 .woff2 fonts self-hosted in `public/fonts/`), 2 Minors accept-risk (test literal constants, README dev-mode port info deferred to Story 7). **Fix round 2 driven by HUMAN VISUAL REVIEW catching 2 defects structural review missed:** Defect A (palette switcher had no collapsed state — visually-identical default vs open baselines; ui-spec §6 listed `palette-switcher-open` as a state but §7 only described the expanded pane) → fixed via new collapsed trigger button + open/close state machine + `aria-expanded`/`aria-controls`/Escape dismissal/click-outside dismissal + ui-spec §6+§7+§8 UA5 clarification + 2 new PaletteSwitcher tests; Defect B (footer clipped from 16/17 baselines — Playwright defaulted to viewport-only capture) → fixed via `{ animations: 'disabled', fullPage: true }` on every `toHaveScreenshot` call. **Defect B surfaced as [`docs/v2-findings/010-playwright-fullpage-default.md`](../v2-findings/010-playwright-fullpage-default.md) — a v2 skill gap;** recommend both `ls-tech-design-v2` and `ls-team-impl-v2` codify `fullPage: true` as the default capture mode for UI-spec-scoped Playwright verification. All 17 baselines regenerated with corrected layouts (default viewport now 1280×903; responsive now 960×1231; footer visible throughout). `.red-ref` rotated to Story 5's SHA post-commit; `pnpm green-verify` confirmed green. Prior accepted-and-committed: Story 0 (`15b3c00` + `7c0446d`) + Story 1 (`e65d7f5`) + Story 2 (`0e51796`) + Story 3 (`b4d578f`) + Story 4 (`9457d11`).

**Previously: BETWEEN_STORIES** — Story 4 accepted and committed 2026-04-17. Cumulative test count: 41 live + 0 skipped. Dual-review (Opus + Codex) caught 1 Critical + 3 Majors + 2 Minors; consolidated fix round drove all fixes + a mid-flight design correction (inMemoryDb-as-test-signal reshape → proper buildTestServer migration). `.red-ref` mechanism established: file is gitignored, written post-commit from bash (UTF-8 guaranteed), guard hardened with BOM/null-byte/SHA validation. `pnpm green-verify` green post-commit. Ready to reload skill and spawn Story 5 (first UI-scope story — landing view + palette system + 17 baseline Playwright screenshots). Prior accepted-and-committed: Story 0 (`15b3c00` + `7c0446d`) + Story 1 (`e65d7f5`) + Story 2 (`0e51796`) + Story 3 (`b4d578f`). Cumulative test count entering Story 4: 26 live + 7 skipped (33 authored). Expected after Story 4: 41 live + 0 skipped (un-skip 7 Story 2 tests + add 8 new: 1 gateExempt + 4 originPreHandler + 3 sessionPreHandler). Story 4 is the first TDD cycle (establishes `.red-ref`); acceptance adds `pnpm green-verify` pass to the gate set. Fresh Claude Code session: team `epic-1-app-shell` recreated 2026-04-17 (ephemeral per `reference_team_directory_ephemeral.md`); ls-team-impl-v2 skill reloaded before Story 4 spawn; Finding 008 standalone-subagent trap explicitly guarded against. Prior accepted-and-committed: Story 0 (`15b3c00` + `7c0446d` deferred fixes) + Story 1 (`e65d7f5`) + Story 2 (`0e51796`) + Story 3 (`b4d578f`). Prior accepted-and-committed: Story 0 (`15b3c00` + `7c0446d` deferred) + Story 1 (`e65d7f5`) + Story 2 (`0e51796`). Team `epic-1-app-shell` recreated again this fresh session (ephemeral per `reference_team_directory_ephemeral.md`); ls-team-impl-v2 skill reloaded; Finding 008 standalone-subagent trap explicitly guarded against. Prior accepted-and-committed: Story 0 (`15b3c00` + `7c0446d` deferred fixes) + Story 1 (`e65d7f5`) + Story 2 (`0e51796`). Cumulative test count entering Story 3: 18 live + 7 skipped; Story 3 should add 8 live → target 26 live cumulative.

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

**2026-04-17 · Story-boundary route-collision is a recurring failure class.** When a story registers a real route at `method+path`, any pre-existing test-file that synthetically registered a route at the same `method+path` via `registerRoute(app, { method, path, ... })` will start throwing on duplicate registration. Story 2 surfaced this with Story 1's `registerRoute.test.ts` case that used `{ method:'POST', path: PATHS.auth.login }` to exercise "state-mutating + exempt + Origin preHandler ordering" — Story 2's new real `POST /auth/login` exempt route collided. Fix: change the synthetic method to a non-colliding verb that preserves intent (Story 2 used `DELETE`; any state-mutating method that isn't also a live real route works). Codex caught this autonomously during iter-2's fix cycle. Applies prospectively: every story adding a route should scan prior story test files for `registerRoute(app, { method, path: <same> })` patterns and pre-empt collisions during authoring. Added to §Materialized Handoff Templates checklist so implementer task sections cover this.

**2026-04-17 · Ambient-`.d.ts` bridge pattern for staged-delivery stories.** Story 2's test files reference `sealFixtureSession()` in `.skip`-wrapped cases that un-skip in Story 4. Rather than typecheck-as-`any` or import a nonexistent module, Codex authored `apps/panel/server/src/test/sealFixtureSession.d.ts` containing a single-line ambient: `export declare function sealFixtureSession(): Promise<string>`. Effects: (a) typecheck stays green in Story 2; (b) Story 4 can drop a matching-signature `.ts` next to it with zero test-file edits; (c) the `.d.ts` itself encodes Story 4's interface commitment — any Story 4 signature drift surfaces immediately. Promote this pattern to every future staged-delivery story where test files reference a not-yet-implemented module. If Story 4 ships the real `.ts` and the `.d.ts` still exists, Story 4 should delete the `.d.ts` as part of its cleanup.

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

### Story 2 — Pre-Acceptance Receipt (2026-04-17)

**CLI evidence references** (3 impl Codex sessions + 1 reviewer Codex session, all via `drive-until-green.sh` harness):

- Impl iter 1 — thread `019d9cde-6bb9-71f1-b724-04fff2c2e589`; JSONL `codex-story-2-impl.iter-1.jsonl` (290KB). Wrapper verdict REAL_ERROR (1 per-command flake recovered on attempt 1, real error on attempt 2 — likely format/typecheck mid-session). Driver composed fix prompt for iter 2.
- Impl iter 2 — thread `019d9ce5-cfd5-7521-bb65-466f12aa42d6`; JSONL `codex-story-2-impl.iter-2.jsonl` (17KB). Wrapper verdict OK; ground-truth gate still red (exit 1). Driver composed fix prompt for iter 3.
- Impl iter 3 — thread `019d9ce6-cd87-7d20-8b4b-5011b9d62dac`; JSONL `codex-story-2-impl.iter-3.jsonl` (34KB). Wrapper verdict REAL_ERROR; ground-truth gate GREEN (exit 0). Driver correctly prioritized ground-truth per rule 6; final report generated.
- Reviewer Codex spec-compliance pass — thread `019d9d3a-2399-7a93-8164-12c8dbc41e4d`; JSONL `codex-story-2-review.iter-1.jsonl`; incremental findings `codex-story-2-findings.md`. Verdict: PASS 0/0/0. Driver report: `codex-story-2-review.impl-report.md`.
- Flakes preserved: 0 walled attempts, 1 per-command `-1073741502` flake on iter 1 attempt 1 (recovered on attempt 2 per rule 9). Delivery marker `DELIVERY_CHECK_MARKER_ECHO_7077` observed 11 times across the 5 JSONLs (impl iter-1/2/3 + flake-attempt-1 + review iter-1).

**Top findings and dispositions** (reviewer's consolidated list — zero Critical, zero Major, two Minor, three bonus observations):

| # | Finding | Severity | Disposition | Reasoning |
|---|---------|----------|-------------|-----------|
| 1 | SSE wire format uses string concatenation (`"event: heartbeat\ndata: " + JSON.stringify(...) + "\n\n"`) in `liveEvents.ts:20-24` instead of a template literal | Minor | **accepted-risk, defer** | Style-only; no functional impact. Can revisit in Epic 4a when real event producers land. |
| 2 | `baseSseEventSchema` (Story 0 scaffold placeholder) still present in `shared/src/sse/events.ts:3-6` alongside the now-canonical `sseEventSchema` | Minor | **defer** | Story 0 already dispositioned this as accepted-risk (finding #4). No incremental cost to leave it for a future cleanup pass. |
| 3 | Test files hardcode `"/oauth/callback"` literals in some assertions instead of `PATHS.oauth.callback` (`oauthCallback.test.ts:13,35,54,75`) | bonus — not flagged as a Minor | **defer** | Consistency nit; does not affect correctness. Too small to round-trip. |

Zero findings routed for implementer rework. Reviewer's independent `pnpm red-verify` + `pnpm verify` matched both the driver's in-session gate and the orchestrator's own run (triple confirmation).

**Reviewer's "what else did you notice" — persistence-worthy observations:**

1. `sealFixtureSession.d.ts` bridge is elegantly designed: skipped tests use `await import('../test/sealFixtureSession.js')` (dynamic), not top-level. The `.d.ts` only satisfies typecheck today; Story 4 lands a runtime `.ts` with matching signature and TS resolves it naturally. Zero test-file edits needed when un-skipping.
2. **Story-boundary route-collision pattern.** Once a route `method+path` becomes real, synthetic test registrations at the same `method+path` collide. Story 2's fix: `POST → DELETE` in `registerRoute.test.ts` (preserves "state-mutating + exempt + Origin preHandler ordering" intent without colliding with the new real `POST /auth/login`). Watch for this on every story that adds routes. Added to §Process Notes.
3. Codex's APPEND obedience was clean: `baseSseEventSchema` was preserved (rule 7 held); `buildServer.ts` diff is pure APPEND (3 imports + 3 register calls); `shared/src/index.ts` APPEND of `./sse/events.js` export.
4. Live tests validate the error envelope via `errorEnvelopeSchema.safeParse(payload).success === true` rather than `.toMatchObject({...})`. This catches Zod-schema drift, not just field presence — good defensive style.
5. `sessionPreHandler` stub is unconditionally throwing (Story 1 stub). Story 4's body replacement keeps the signature + module path; no test-file changes needed for the `/live/events` cluster.
6. Vitest "1 skipped file" is `auth.test.ts` (all 4 tests `it.skip`, so the suite counts as skipped). Expected and correct, not a misfire.
7. No `.only` / `.todo` leftovers; grep clean.
8. Biome/format/lint/typecheck clean across all 3 packages — suggests the implementer's inner iter-3 re-ran `pnpm verify` before declaring done.

**Exact story gate commands run by orchestrator** (ground truth, ran 2026-04-17T21:05 local):
- `pnpm red-verify` → exit 0 (40 files clean via biome; 3 packages typecheck clean)
- `pnpm verify` → exit 0 (18 tests live cumulative: 3 shared from Story 0 + 15 server [2 buildServer + 3 registerRoute + 3 errorHandler + 3 oauthCallback + 4 liveEvents + 0 live in auth.test.ts]; 7 skipped; 22 total authored)
- `grep -rn '"link:' apps/*/package.json package.json` → 0 matches (no dep-graph regression)
- `git diff --stat` across all touched paths: `buildServer.ts` (+6 insertions, APPEND only); `registerRoute.test.ts` (4 lines changed = 2-line POST→DELETE rename, no coverage weakening); `docs/epic-1-app-shell/team-impl-log.md` (orchestrator's own state edit). No overwrite regressions.
- `grep -rn '\.skip' apps/panel/server/src/routes/` → 7 hits across 3 files (`auth.test.ts` 4, `liveEvents.test.ts` 2, `oauthCallback.test.ts` 1); all carry TC tags and Story-4 dependency citations per reviewer's file-level audit.
- Delivery marker present in every Codex JSONL.

**UI spec compliance:** N/A for Story 2 (activates at Story 5).

**Open risks:** none blocking; two Minor deviations + one bonus consistency nit dispositioned above with their venues identified.

### Story 2 Orchestration Observations (captured for v2-findings + future handoffs)

1. **"Implementer silent post-completion" is now a confirmed PATTERN, not a one-off.** Story 1's implementer went silent; orchestrator had to read the driver's `impl-report.md` from disk. Story 2's implementer did the same — silent for ~83 minutes after the driver exited GREEN. In both cases the harness's auto-generated `impl-report.md` saved the cycle, but the team-lead's handoff discipline (fresh reviewer, CLI evidence, etc.) depends on a prompt §Step 6 relay. Mitigation proposal captured for next template rewrite: implementer should invoke the driver with `run_in_background: true` and use the `Monitor` tool on the driver log, which would force a new turn per stdout line. A periodic `[drive] heartbeat <iter> @ <epoch>` line emitted by `drive-until-green.sh` every ~N seconds would turn this into a structural keepalive, bypassing the "agents forget to report back" failure mode entirely. Orchestrator also failed at its end — treated idle bursts as routine turn boundaries per Finding 002 and did not nudge for ~83 minutes; user had to prompt. The orchestrator-side nudge threshold ("20 min of silence during long runs") was defined but not actually enforced by any timer, because Claude Code agents only have turn boundaries, not wall-clock alarms. The Monitor-based keepalive closes both halves of the gap.

2. **Codex's 3-iteration ladder was clean and expected.** Iter 1 hit a per-command flake + real error (likely typecheck surfacing `@types/node` or registerRoute.test.ts's POST→DELETE need); iter 2 produced valid changes (wrapper OK) but gate still red (something the fix prompt surfaced); iter 3 wrapper REAL_ERROR but gate GREEN — exactly the harness-designed shape where wrapper counts intermediate failures but ground-truth gate is authoritative. No walls, no flake exhaustion. The outer loop did its job.

3. **Story-boundary route-collision pattern.** When Story 2 landed a real `POST /auth/login` exempt route, Story 1's `registerRoute.test.ts` case that used `{ method:'POST', path: PATHS.auth.login }` as a synthetic "state-mutating exempt + Origin preHandler ordering" test started failing (duplicate route registration). Codex caught it during iter-2's fix cycle and changed the synthetic method to `DELETE` (preserves intent, eliminates collision). Worth adding to §Process Notes as a recurring failure class: any story adding a route needs to scan Story 1's test file (and successor test files) for prior synthetic `registerRoute` uses at the same `method+path`. Added below.

4. **Warm-cache inheritance worked.** Reviewer's Codex pass continued the cached-prefix pattern from Story 1; implementer's iter-2 and iter-3 reused the prefix from iter-1 (same reading order, same env-rules block prepended by `compose-prompt.sh`). No token-accounting numbers captured this run, but iteration 2 + 3 completed in under 4 minutes combined vs. iter-1's ~8 minutes — consistent with prompt-cache activation.

5. **`sealFixtureSession.d.ts` bridge is the right discipline for staged-delivery stories.** Story 4's test-plan commitment is to un-skip 7 tests. If Story 2's tests had tried to import a runtime module that doesn't exist, typecheck would have to error-or-any'd the call sites. Codex's choice — a one-line ambient `.d.ts` with the exact signature Story 4 must match — keeps typecheck green now, constrains Story 4's interface, and needs zero test edits on un-skip. Promote this pattern to the team-impl-log for all staged-delivery stories: when tests reference a module whose implementation lands in a future story, author an ambient `.d.ts` stub with the expected signature.

### Story 3 — Pre-Acceptance Receipt (2026-04-17)

**CLI evidence references** (3 Codex sessions: 2 implementer + 1 reviewer + 1 fix-round):

- Impl iter 1 — thread `019d9d60-b8d6-7a52-a2a8-6b379aa0edc3`; JSONL `codex-story-3-impl.iter-1.jsonl`. Wrapper verdict REAL_ERROR; Codex completed a session-wide wall on attempt 1 (every PowerShell child `-1073741502` except the initial marker); wrapper correctly classified FLAKE_DETECTED and relaunched on attempt 2, which cleared. Iter 1 did the bulk of implementation: installed deps, wrote `db.ts`, `installMetadata.ts`, baseline SQL, `_journal.json`, `tempSqlitePath.ts`, `db.test.ts`; modified `buildServer.ts`, `config.ts`, both package.jsons, README. Codex hit and self-diagnosed two real issues: (a) pnpm 10's `onlyBuiltDependencies` silently blocking `better-sqlite3`'s native build (the wrapper said `pnpm install` exit 0 but the `.node` binary never landed), and (b) Drizzle 0.45's requirement for `--> statement-breakpoint` between multi-statement migration files. Codex resolved (a) by running `pnpm run install` inside the package directory directly and (b) by editing the SQL to include the breakpoint marker. In-session `pnpm red-verify` + `pnpm verify` both exited 0.
- Impl iter 2 — thread `019d9d68-6ee8-7370-accc-78779dbcb6f4`; JSONL `codex-story-3-impl.iter-2.jsonl`. Iter 1's in-session gate was deceptive: the driver's authoritative post-session gate caught 3 biome format violations (CRLF trailing newline in server/package.json, indentation in db.test.ts:154-157, line-wrap in buildServer.ts:24) plus one typecheck failure (`noUncheckedIndexedAccess` on `PRAGMA user_version` destructure at db.test.ts:40). Driver composed a surgical fix prompt, iter 2 applied `biome format --write` to the 3 files and added a null-guard on the pragma result. Ground-truth gate after iter 2: `pnpm red-verify` exit 0, `pnpm verify` exit 0.
- Reviewer Codex spec-compliance — thread `019d9dab-8b62-7e62-bfea-136b14bebaa2`; JSONL `codex-story-3-review.iter-1.jsonl`; findings captured at `codex-story-3-findings.md`. Reviewer took ~9 minutes in the pre-Codex reflection phase (reading 9 artifacts: harness, tech-design index + server companion, test-plan, epic, story, coverage, impl-report, and the 10 implementation files). Codex's review executed `pnpm --filter @panel/server test -- src/data/db.test.ts` directly (dynamic verification of the 8 tests in isolation), confirmed all 6 TCs + 2 non-TC present, and flagged one Major: missing `pnpm.onlyBuiltDependencies` block in root `package.json` — without which a fresh `pnpm install` silently skips building `better-sqlite3`'s native binding.
- Fix-round Codex — thread `019d9db5-16b0-7f51-8bb2-f04594e16bc9`; JSONL `codex-story-3-fix.iter-1.jsonl`; driver report `codex-story-3-fix.impl-report.md`. Driver exit 0 GREEN iter 1/3. Reviewer's Opus architectural review escalated the finding from Major → Critical after empirically reproducing it: `pnpm install --force --no-frozen-lockfile` emitted "Ignored build scripts: better-sqlite3@12.9.0, electron-winstaller@5.4.0, electron@41.2.1" and subsequent tests failed 22/30 on missing bindings. Fix: reviewer had Codex add a top-level `pnpm.onlyBuiltDependencies` array to root `package.json` containing `better-sqlite3`, `electron`, `electron-winstaller` (alphabetized). No other file touched. Post-fix `pnpm install --force --no-frozen-lockfile` completes with `electron-builder install-app-deps` firing and no ignored-scripts warning.

**Top findings and dispositions:**

| # | Finding | Severity | Disposition | Reasoning |
|---|---------|----------|-------------|-----------|
| 1 | Missing `pnpm.onlyBuiltDependencies` allowlist for native builds (pnpm 10 silent-skip) | **Critical** (empirical) | **fixed** | Reviewer reproduced failure on clean `pnpm install`; green state was an artifact of the implementer's in-cycle manual rebuild. Fix applied in-cycle via Codex; gates re-green post-fix. |

Zero Major, zero Minor, zero accepted-risk, zero defer.

**Reviewer's "what else did you notice":**

1. `tempSqlitePath.ts` uses `os.tmpdir()` which resolves to `C:\Users\dsavi\AppData\Local\Temp\` on Windows — the finding-004-safe path. Good choice (not a finding).
2. `resolveUserDataDbPath` non-Electron fallback is `os.tmpdir()/panel-dev.sqlite`. Pure-Node dev contexts would create a real dev DB there; `buildTestServer` always forces `inMemoryDb: true` so tests are safe. If a future story adds a non-Electron dev runner, surface the fallback in docs (not a Story 3 issue).
3. `drizzle-kit` is NOT present as a devDependency — the baseline SQL + `_journal.json` were hand-crafted. Drizzle's runtime `migrate()` only needs the SQL files + journal, so the migration system works. If a future story needs `drizzle-kit generate`, add it then.
4. `installMetadata` Drizzle schema object is exported but not yet consumed — scaffolding for later epics that will query install_metadata.
5. `drizzle/meta/_journal.json` version `"7"` + entry version `"6"` + `breakpoints: true` matches drizzle-kit's current output format and correctly signals the migrator to honor `--> statement-breakpoint`.

**Exact story gate commands run by orchestrator** (ground truth, ran 2026-04-17T19:20 local):
- `pnpm red-verify` → exit 0 (biome format: 45 files clean; biome lint: 45 files clean; typecheck across 3 packages clean)
- `pnpm verify` → exit 0 (server: 23 passed | 7 skipped (30 total); shared: 3 passed; client: 0 tests [passWithNoTests])
- `grep -rn '"link:' apps/*/package.json package.json` → 0 matches (no dep-graph regression)
- `ls pnpm-lock.yaml*` → only `pnpm-lock.yaml` (no transient backups)
- `git diff --stat`: `README.md` (+4), `server/package.json` (+3), `buildServer.ts` (+6), `config.ts` (+22), `package.json` (+13, includes reviewer's onlyBuiltDependencies fix), `pnpm-lock.yaml` (+2911), `team-impl-log.md` (orchestrator state edit)
- New (untracked → committed): `apps/panel/server/drizzle/0001_install_metadata.sql`, `apps/panel/server/drizzle/meta/_journal.json`, `apps/panel/server/src/data/db.ts`, `apps/panel/server/src/data/db.test.ts`, `apps/panel/server/src/data/schema/installMetadata.ts`, `apps/panel/server/src/test/tempSqlitePath.ts`

**UI spec compliance:** N/A for Story 3 (activates at Story 5).

**Open risks:** none blocking; zero items deferred.

### Story 3 Orchestration Observations (captured for v2-findings + future handoffs)

1. **"In-session gate ≠ ground-truth gate" is a recurring failure class.** Story 2 was lucky; Story 3 surfaced three instances:
   - Iter 1: Codex's in-session `pnpm verify` exit 0 hid 3 biome format issues + 1 typecheck failure. Driver's authoritative post-session gate caught them.
   - Iter 1 secondary: Codex's `pnpm verify` passed because the native binding had been manually built mid-session. Reviewer caught this empirically by running `pnpm install --force --no-frozen-lockfile` from a clean state.
   - The harness is robust here: the driver's ground-truth gate is authoritative, and multi-round review (reviewer Codex + reviewer's own Opus architectural pass + empirical reproduction) caught what single-pass review would have missed.
   Lesson for future stories: reviewer's empirical reproduction of native-build / install pipeline claims is essential for any story that touches `postinstall`, `pnpm.onlyBuiltDependencies`, or native modules.

2. **Session-wide walls still a recurring pattern on Windows.** Story 3's iter 1 attempt 1 hit a clean wall (marker succeeded, every subsequent PowerShell command flaked with `-1073741502`). Wrapper correctly classified FLAKE_DETECTED and relaunched on attempt 2, which cleared without retry. Finding 009 behavior held. Zero walled attempts preserved in the final artifact set because attempt 1 was preserved as `iter-1.jsonl` and attempt 2 overwrote (both are the same stem). Budget impact: ~4 minutes spent walled; acceptable.

3. **pnpm 10's `onlyBuiltDependencies` is a new Windows-environment gotcha.** Before pnpm 10, native modules built on install by default. Pnpm 10 flipped this to an opt-in allowlist for supply-chain security, which silently breaks native-module pipelines. Project memory should capture this: **any native-dep addition in this repo requires adding the package to root `package.json` `pnpm.onlyBuiltDependencies`**. Epic 2's keytar (OS keychain) and any future Epic 3+ native deps will need the same treatment.

4. **Reviewer empirical reproduction as standard practice.** The Major → Critical severity escalation only happened because the reviewer ran `pnpm install --force --no-frozen-lockfile` themselves to verify the claim rather than trusting code-only inspection. This should be standard practice for stories with install-pipeline claims. Adding to template reminders for future review handoffs.

5. **Implementer silent post-driver-exit, take 3.** Story 1 + Story 2 had it; Story 3 repeated the pattern but under different conditions. Driver exited ~22:31 local; implementer SendMessage relay came at 22:34 after an orchestrator nudge. ~3 minutes of silence this time (much better than 83-min Story 2) — possibly because the implementer's own `run_in_background: true` + Monitor set-up from the handoff template kept them more engaged. Orchestrator-side Monitor caught the GATES GREEN event in real time, so the cycle wasn't blocked; nudge was for completeness. Pattern not fully eliminated; a driver-emitted heartbeat every 30-60s would close this entirely.

6. **Reviewer spawn → Codex JSONL lag was ~9 minutes.** Expected for a dual review — reviewer reads 9 artifacts + writes reflection before composing Codex prompt. Not a concern; Monitor's periodic heartbeat every 2 minutes reassured the orchestrator the reviewer was still alive during the silent window.

### Story 3 — Transition Checkpoint (accepted + committed 2026-04-17)

**Cumulative test count after Story 3: 26 live + 7 skipped = 33 authored.** Breakdown: 3 shared (Story 0 unchanged) + 23 server (Story 1's 8 + Story 2's 7 live + Story 3's 8). Skipped tally unchanged at 7 (Story 4 un-skips). Story 4 should add the un-skips + cookie/session tests per `test-plan.md` Chunk 4.

**Problems encountered:**
1. Session-wide wall on iter 1 attempt 1 (wrapper-recovered).
2. In-session gate deception: biome format + typecheck failures passed Codex's own `pnpm verify` but failed the driver's post-session gate.
3. Native-build silent-skip: `pnpm install` exit 0 without building `better-sqlite3`'s Node-ABI binding due to pnpm 10's `onlyBuiltDependencies` default.
4. Drizzle 0.45 migration SQL required `--> statement-breakpoint` between multi-statement files — omitted at first write, caught by test execution.
5. Implementer silent ~3 min post-driver-exit (third occurrence; orchestrator-side Monitor made this non-blocking).

**Impact and resolution:** all five absorbed in-cycle. Problems 1, 2, 4: Codex + harness resolved without orchestrator touching code. Problem 3: caught by reviewer empirical reproduction, Codex applied the fix, gates re-green post-fix. Problem 5: orchestrator nudge cleared in under a minute; impl-report already on disk. Boundary inventory: SQLite filesystem advanced from "planning only" to "integrated" (Story 3 ships `openDatabase` + `applyMigrations` + baseline `install_metadata` schema); Twitch OAuth stubs unchanged; keychain still not-started; SSE stubs unchanged; Electron shell still not-started; GitHub Actions CI still partial; session-cookies still not-started.

**Recommendations for Story 4 (server-side gate + Origin + session + cookies):**
- Un-skip exactly the 7 tests enumerated in Story 2's §Pre-Acceptance Receipt (4 auth + 1 oauthCallback + 2 liveEvents). Story 4 DoD cross-references this list.
- Replace `apps/panel/server/src/test/sealFixtureSession.d.ts` with a real `sealFixtureSession.ts` whose exported signature matches `(): Promise<string>` exactly — no test-file edits should be needed.
- The `baseSseEventSchema` accepted-risk from Story 0 now has a second deferred disposition (Story 2 reviewer Minor #2). Story 4 is a natural cleanup venue if scope allows; otherwise promote to pre-verification cleanup.
- `iron-session@8` adds as a dependency. Verify it does NOT need `pnpm.onlyBuiltDependencies` — it's pure JS (no native). Only add to allowlist if `pnpm install` shows it in "Ignored build scripts".
- Prompt cache prefix: keep the same reading order; Story 3's cache prefix should still apply.

**Boundary inventory after Story 3:**

| Boundary | Status | Owning Story | Change from Story 2? |
|----------|--------|--------------|----------------------|
| Twitch OAuth (`/auth/login`) | **stub body present** (501 NOT_IMPLEMENTED) | Story 2 → Story 4 (real Origin gate) → Epic 2 (real flow) | — |
| Twitch OAuth callback (`/oauth/callback`) | **stub body present** (501 NOT_IMPLEMENTED) | Story 2 → Epic 2 | — |
| Live SSE producers | **stub cadence present** (heartbeat every 15s; session-gated) | Story 2 → Story 4 (real session gate un-skips) → Epic 4a (real producers) | — |
| SQLite filesystem | **integrated** (`install_metadata` baseline + openDatabase + applyMigrations + resolveUserDataDbPath) | Story 3 | **advanced** (was planning-only) |
| Twitch Helix / EventSub | not started | Epic 3 / Epic 4a | — |
| OS keychain (`keytar`) | not started | Epic 2 | — |
| Electron shell | not started | Story 7 | — |
| GitHub Actions CI | partial (docs-fallback) | Story 9 | — |
| Session cookies (`iron-session`) | not started | Story 4 | — |

### Story 2 — Transition Checkpoint (accepted + committed 2026-04-17)

**Cumulative test count after Story 2: 18 live + 7 skipped = 25 authored.** Breakdown: 3 shared (Story 0 unchanged) + 15 server (Story 1's 8: 2 buildServer + 3 registerRoute + 3 errorHandler; Story 2's 7 live: 3 oauthCallback + 4 liveEvents + 0 in auth.test.ts). Story 3 should add data-layer tests per `test-plan.md` Chunk 3; the cumulative floor is ≥ 18 live (and the 7 skips remain inert until Story 4 un-skips them).

**Problems encountered:**
1. Implementer silent ~83 min post-driver-exit (second occurrence of the Story 1 pattern; orchestrator also silent during that window — neither side's "10-min cadence" discipline engaged).
2. Story-boundary route-collision surfaced in iter-2 fix cycle — Codex resolved in-session (POST→DELETE rename in `registerRoute.test.ts`).
3. `sealFixtureSession` reference in Story 2 test files needed a type declaration bridge (`sealFixtureSession.d.ts`) to keep typecheck green ahead of Story 4's real implementation. Not anticipated in Story 2's DoD; Codex added it autonomously as a bridge.

**Impact and resolution:** problem 1 became a v2-findings / template-hardening candidate (Monitor-tool-based keepalive proposal); problems 2 and 3 were absorbed during iteration without orchestrator intervention. Story 2 ships green; zero regressions in Story 0/1 files; `buildServer.ts` APPEND discipline held; no link: regressions. Boundary inventory: Twitch OAuth stub now has `501 NOT_IMPLEMENTED` bodies (advanced from "path reserved"); SSE stub now emits heartbeat cadence (advanced from "path reserved"); session-cookie boundary still not-started (Story 4).

**Recommendations for Story 3 (data-layer bootstrap, blocked-by: Story 0 only):**
- Story 3 does NOT depend on Story 2. It can run from the current baseline unchanged.
- Do NOT wire the real DB path into `server/config.ts` yet unless tech-design-server.md §Server Binding explicitly says Story 3 owns it (my read: Story 3 introduces `openDatabase(path)` + `install_metadata` migration; `resolveUserDataDbPath()` wiring lands in Story 3, threading through `loadConfig`).
- Story 1's Minor #3 ("databasePath returns `process.cwd()`") is a Story 3 deliverable — remind implementer the fix belongs in Story 3's scope.
- Prompt cache prefix: keep the same reading order so the ~3.6M cached tokens still apply.

**Recommendations for Story 4 (when it comes — Story 3 is next):**
- Un-skip exactly the 7 tests enumerated in Story 2's §Pre-Acceptance Receipt (4 auth + 1 oauthCallback + 2 liveEvents). Story 4 DoD should cross-reference this list.
- Replace `apps/panel/server/src/test/sealFixtureSession.d.ts` with a real `sealFixtureSession.ts` whose exported signature matches `(): Promise<string>` exactly — no test-file edits should be needed.
- The `baseSseEventSchema` accepted-risk from Story 0 now has a second deferred disposition (Story 2 reviewer Minor #2). Story 4 is a natural cleanup venue if scope allows; otherwise promote to pre-verification cleanup.

**Boundary inventory after Story 2:**

| Boundary | Status | Owning Story | Change from Story 1? |
|----------|--------|--------------|----------------------|
| Twitch OAuth (`/auth/login`) | **stub body present** (501 NOT_IMPLEMENTED) | Story 2 → Story 4 (real Origin gate) → Epic 2 (real flow) | advanced |
| Twitch OAuth callback (`/oauth/callback`) | **stub body present** (501 NOT_IMPLEMENTED) | Story 2 → Epic 2 | advanced |
| Live SSE producers | **stub cadence present** (heartbeat every 15s; session-gated) | Story 2 → Story 4 (real session gate un-skips) → Epic 4a (real producers) | advanced |
| Twitch Helix / EventSub | not started | Epic 3 / Epic 4a | — |
| OS keychain (`keytar`) | not started | Epic 2 | — |
| SQLite filesystem | integrated (planning only) | Story 3 | — |
| Electron shell | not started | Story 7 | — |
| GitHub Actions CI | partial (docs-fallback) | Story 9 | — |
| Session cookies (`iron-session`) | not started | Story 4 | — |

### Story 4 — Pre-Acceptance Receipt (2026-04-17)

**CLI evidence references** (4 Codex sessions: 1 impl + 1 review + 2 fix-round iters; 1 aborted fix driver via user-directed reshape):

- Impl iter 1 — thread `019d9dd8-4815-75d0-a773-fb54beec6201`; JSONL `codex-story-4-impl.iter-1.jsonl`. Driver exit 0 GREEN on iter 1 (attempt 2 of 3 after one per-command flake — Rule 9 handled). 10 deliverables landed: originPreHandler + sessionPreHandler real bodies, iron-session + @fastify/cookie installed, config.ts allowedOrigins + cookieSecret additions, sealFixtureSession.ts (replaced .d.ts bridge), 3 new test files (gateExempt + originPreHandler + sessionPreHandler), 7 Story 2 skips un-skipped. Implementer's caveat surfaced the `.red-ref` UTF-16 encoding issue pre-accept — elevated to full Critical by reviewer.
- Review — thread `019d9df3-6888-7bb3-8c3b-d16341000141`; JSONL `codex-story-4-review.iter-1.jsonl`; findings at `codex-story-4-findings.md`. Empirically reproduced `pnpm green-verify` exit 1 (CRITICAL). Surfaced 3 additional Majors the implementer didn't flag: (a) `process.env.VITEST` sniff in production SSE handler (wrong seam — tech-design specifies `timerMode` via `BuildServerOptions`); (b) coupled cookie-secret defaults with VITEST-detection override in `buildServer.ts` (production bootstrap sniffing test runner env); (c) TC-7.4a used exempt route so preHandler-order reversal would still pass (no discrimination power). 2 Minors: 8 stale "un-skip once Story 4 lands" comments. Delivery marker observed 2× across impl + review JSONLs.
- Fix round iter 1 — thread `019d9e09-6c2b-7e42-85c1-5f3fcaee67da`; JSONL `codex-story-4-fix.iter-1.jsonl`. Wrapper REAL_ERROR; driver correctly routed to iter-2 with composed fix prompt per rule 6. **(One prior fix driver was killed by orchestrator mid-flight — see §Story 4 Process Notes #1 below.)**
- Fix round iter 2 — thread `019d9e0e-f379-7f81-ab49-e47181061f42`; JSONL `codex-story-4-fix.iter-2.jsonl`. Wrapper OK; ground-truth gate GREEN. All 6 fix items applied in one session with zero walls and zero relaunches.

**Top findings and dispositions** (consolidated from reviewer's list; all dispositioned):

| # | Finding | Severity | Disposition | Reasoning |
|---|---------|----------|-------------|-----------|
| 1 | `.red-ref` UTF-16-LE + BOM + CRLF from PowerShell `>` → `guard-no-test-changes.mjs` `ERR_INVALID_ARG_VALUE` → `pnpm green-verify` exit 1 | **Critical** | **fixed** | `.red-ref` gitignored + deleted from working tree; guard hardened with BOM strip + null-byte strip + 40-char hex SHA validation (exits 2 with debug hex dump on invalid); orchestrator writes `.red-ref` post-commit from bash via `printf '%s\n' "$(git rev-parse HEAD)" > .red-ref` (UTF-8 guaranteed). |
| 2 | `process.env.VITEST` sniff in `liveEvents.ts` production handler | Major | **fixed** | `BuildServerOptions.timerMode?: 'fake' \| 'real'` default `'real'` extended; `buildTestServer` defaults `timerMode: 'fake'`; `req.server.config.timerMode` replaces all `process.env.VITEST` checks; zero hits repo-wide verified. |
| 3 | Coupled cookie-secret defaults + `inMemoryDb+VITEST` override in `buildServer.ts` | Major | **fixed** | `FIXTURE_COOKIE_SECRET` exported from `sealFixtureSession.ts`; `buildTestServer` explicitly passes `config: { cookieSecret: FIXTURE_COOKIE_SECRET }`; VITEST override block deleted from `buildServer.ts`; production bootstrap no longer sniffs test context. Route tests migrated from `buildServer({ inMemoryDb: true })` → `buildTestServer()` (14 call sites across `auth.test.ts`, `liveEvents.test.ts`, `oauthCallback.test.ts`) to achieve clean separation — `inMemoryDb` retains its original Story 3 meaning as a SQLite path selector only. |
| 4 | TC-7.4a uses exempt `/auth/login` → can't discriminate preHandler order | Major | **fixed** | Rewritten in place: registers inline `POST /test-gated-post` (new non-exempt gated route), asserts 403 `ORIGIN_REJECTED` with no cookie + bad Origin. Reversed order would throw 401 first → assertion fails → genuine discrimination power. |
| 5 | 8 stale "un-skip once Story 4 lands" comments | Minor | **fixed** | Removed from `auth.test.ts` (4), `liveEvents.test.ts` (2), `oauthCallback.test.ts` (1), `registerRoute.test.ts` (1). |
| 6 | `RESTART-INSTRUCTIONS.md` deletion (out of scope per story DoD) | Minor | **accepted-risk** | Log's Run Metadata already marked the file stale-slated-for-cleanup; Codex's deletion aligns with that cleanup intent. No re-add. |

Zero findings remain open. Reviewer Codex's `pnpm red-verify` + `pnpm verify` runs matched the orchestrator's independent post-fix gates (triple confirmation); `pnpm green-verify` exit 0 confirmed post-commit.

**Exact story gate commands run by orchestrator (ground truth, ran 2026-04-17T21:07 local):**
- `pnpm red-verify` → exit 0 (48 files clean via biome; 3 packages typecheck clean)
- `pnpm verify` → exit 0 (41 live tests: 4 shared [3 codes + 1 gateExempt] + 37 server [2 buildServer + 3 registerRoute + 3 errorHandler + 4 auth + 3 oauthCallback + 6 liveEvents + 4 originPreHandler + 3 sessionPreHandler + 8 data (data/db.test.ts)])
- `pnpm green-verify` → exit 0 POST-COMMIT (guard skipped when `.red-ref` absent, then ran clean when `.red-ref == HEAD`)
- `grep -rn 'process.env.VITEST' apps/panel/server/src/` → 0 hits
- `grep 'buildServer(' apps/panel/server/src/routes/*.test.ts` → 0 hits (all 14 migrated to `buildTestServer()`)
- `grep -rn '"link:' apps/*/package.json package.json` → 0 matches (no dep-graph regression)
- `git diff --stat` across all touched paths: 17 files changed, +171/-135 — no replace-instead-of-append regressions. Biome auto-migrated CRLF warnings on next Git touch (advisory only).

**UI spec compliance:** N/A for Story 4 (activates at Story 5).

**Open risks:** none blocking.

### Story 4 Orchestration Observations (captured for v2-findings + future handoffs)

1. **Implementer-surfaced findings can still miss Critical.** Story 4's implementer surfaced the `.red-ref` UTF-16 encoding issue in their driver-exit report — but framed it as a fix-at-commit-time caveat rather than a DoD-blocker. Only the reviewer's empirical `pnpm green-verify` reproduction elevated it to Critical. Lesson: when implementer flags a "known issue" that touches an acceptance gate, reviewer must run that gate themselves. This is the second time a Critical was only caught by reviewer empirical reproduction (Story 3's pnpm.onlyBuiltDependencies being the first).

2. **Mid-flight fix-impl design correction.** First fix-round task section proposed `buildServer` using `options.inMemoryDb === true` as a test-context trigger for `timerMode: 'fake'` + `FIXTURE_COOKIE_SECRET` defaults — functionally correct but semantically equivalent to the original MAJOR-2 violation (substituting one caller-provided signal for `process.env.VITEST`). Orchestrator killed the running driver, redirected to the correct shape (14 route-test call sites migrated from `buildServer({ inMemoryDb: true })` → `buildTestServer()`; `buildServer` kept test-ignorant; `buildTestServer` becomes the single touch-point for test fixtures). One sunk Codex iter cost vs. shipping a round-2 review catch — correct tradeoff. Pattern for future handoffs: "do not touch test files" is often too strict; the right rule is "test-infrastructure migration is in scope; test-logic changes are not." My initial fix brief had this wrong and the course-correction was necessary.

3. **Reviewer's discrimination argument on TC-7.4a was exemplary.** The test was structurally correct (asserted 403 on bad Origin) but had no discrimination power because `/auth/login` is session-exempt so preHandler order was unobservable. Catching this requires thinking about what a reversed-order bug WOULD look like and whether the test would distinguish it. Store for v2-findings: "does this test discriminate the bug it claims to catch?" should be a standard reviewer question when the AC specifies an ordering or sequencing invariant.

4. **Clean fix-round with zero walls, two iterations, bounded outer loop.** Fix round iter 1 caught a real error; fix iter 2 landed clean. Driver composition held. Total fix-round wall-clock ~22 minutes (including mid-flight reshape). No session walls this run — the 3-attempt relaunch cap from Finding 009 was not needed.

5. **Log receipts + transition checkpoints are a core deliverable.** This log is now at ~780 lines with rich per-story narrative. The overhead is real but the return is substantial: future reloads (mid-epic, cross-session) have complete context, and downstream skill refinement has grounded evidence to work from. Worth the investment.

### Story 4 — Transition Checkpoint (accepted + committed 2026-04-17)

**Cumulative test count after Story 4: 41 live + 0 skipped.** Breakdown: 4 shared (Story 0's 3 codes + Story 4's 1 gateExempt) + 37 server (Story 1's 8 + Story 2's 7 now-live + Story 3's 8 + Story 4's 14 [4 auth un-skipped + 3 oauthCallback un-skipped originally counted in 7, plus 4 originPreHandler + 3 sessionPreHandler new]). Story 5 should add renderer tests + 17 baseline Playwright screenshots per UI spec Chunk 5; cumulative floor entering Story 5 is ≥ 41 live.

**Problems encountered:**
1. `.red-ref` UTF-16 encoding from PowerShell `>` redirect — would have silently broken Story 5's first commit.
2. Reviewer surfaced 3 additional Majors the implementer didn't flag (VITEST sniff, coupled cookie secrets, TC-7.4a non-discrimination).
3. Initial fix-round design drift (inMemoryDb-as-test-signal) — caught + reshaped mid-flight by orchestrator.
4. Implementer silent cadence persists — consistent with Stories 1/2/3 pattern.

**Impact and resolution:** all four absorbed in-cycle. Problem 1 → gitignored + guard hardened + bash-written post-commit. Problems 2–3 → consolidated fix round via drive-until-green.sh (2 iters). Problem 4 → orchestrator-side Monitor + nudges kept signal live. Final gates triple-confirmed (driver + orchestrator + green-verify post-commit). Boundary inventory: iron-session + @fastify/cookie deps landed; session-cookies boundary advances from "not started" to "wired (401 branch exercised; cookie issuance deferred to Epic 2)"; SSE producers from "stub cadence" to "real session-gated stub cadence" (Story 4 un-skipped its tests but producers remain stubs until Epic 4a).

**Recommendations for Story 5 (first UI-scope story, blocked-by: Story 0 + UI spec):**
- Story 5 is the first story where **human visual review is a hard gate**. Playwright screenshots must be produced per `docs/epic-1-app-shell/ui-spec.md`'s verification surface; surface them to the user before accept, not after.
- `.red-ref` is now authoritative. Any Story 5 test-file change (adding renderer tests is expected) will fail `pnpm green-verify` until orchestrator updates `.red-ref` to Story 5's own commit SHA post-commit. This is by design — Story 5 is a new Red commit.
- Cache prefix: Stories 0–4 used a consistent reading order. Story 5 introduces the UI spec as a first-class artifact; keep it after tech-design-client.md in the reading order to preserve cache benefits.
- `buildTestServer` is now the single test factory. Renderer-adjacent integration tests (if any in Story 5) should use it or compose their own MSW-backed test shell; do not reintroduce `buildServer({ inMemoryDb: true })` in test code.

**Boundary inventory after Story 4:**

| Boundary | Status | Owning Story | Change from Story 3? |
|----------|--------|--------------|----------------------|
| Twitch OAuth (`/auth/login`) | **stub body + real Origin gate** (501 NOT_IMPLEMENTED) | Story 2 → Story 4 → Epic 2 | advanced (real Origin validation active) |
| Twitch OAuth callback (`/oauth/callback`) | **stub body + exempt gate** (501 NOT_IMPLEMENTED) | Story 2 → Epic 2 | — |
| Live SSE producers | **stub cadence + real session gate** (heartbeat every 15s; 401 on no session) | Story 2 → Story 4 → Epic 4a | advanced (real session gate active) |
| SQLite filesystem | integrated | Story 3 | — |
| Session cookies (`iron-session`) | **wired (unseal path active; issue path Epic 2)** | Story 4 | **advanced** (was not started) |
| Twitch Helix / EventSub | not started | Epic 3 / Epic 4a | — |
| OS keychain (`keytar`) | not started | Epic 2 | — |
| Electron shell | not started | Story 7 | — |
| GitHub Actions CI | partial (docs-fallback) | Story 9 | — |

### Story 5 — Pre-Acceptance Receipt (2026-04-17)

**CLI evidence references** (5 Codex sessions across implementer + reviewer + 2 fix rounds):

- Impl iter 1 — thread `019d9e2e-d263-77e2-bc8b-905f6725ca35`; JSONL `codex-story-5-impl.iter-1.jsonl`. Driver GREEN on iter 1 of 4 (attempt 2 after single per-command flake; Rule 9 handled). Delivered 25 Vitest tests + 17 Playwright baselines (initial viewport-only) + empty `public/fonts/` beyond README (fix round 1 filled).
- Reviewer spec-compliance Codex pass — thread `019d9e67-5bc1-7600-aac3-3210939b7dc7`; JSONL `codex-story-5-review.iter-1.jsonl`; findings `codex-story-5-findings.md`. Verdict 1 Critical + 3 Major + 2 Minor (dispositions below).
- Fix round 1 Codex — thread `019d9e74-a408-7dc1-93ae-ff196199c08c`; JSONL `codex-story-5-fix.iter-1.jsonl`. Addressed Major #2 (usePalette narrowing), #3 (Google CDN removal), #4 (self-hosted .woff2 fetch: PressStart2P-Regular 12.5KB, SpaceMono-Regular 16.5KB, SpaceMono-Bold 16.7KB; all valid `wOF2` magic bytes). Iter 1/1, GREEN.
- Fix round 2 Codex — threads `019d9e86-69c2-7db2-89f7-cfaa4366b17c` (iter 1) + `019d9e8d-7ed7-7c23-b017-c1a4d92e3ba4` (iter 2); JSONLs `codex-story-5-fix-round-2.iter-{1,2}.jsonl`. **Driven by human visual review** — Defect A (palette switcher had no collapsed state) and Defect B (footer clipped by Playwright viewport-only default capture). Iter 1 landed component rewrite + spec edits; iter 2 cleaned a `<section role="region">` → `<section aria-label=...>` typing correction plus a format nit. Iter 2/2 GREEN; all 17 baselines regenerated via `--update-snapshots`.

Delivery marker `DELIVERY_CHECK_MARKER_ECHO_7077` observed in every Codex JSONL (2× each, 5 sessions = 10 total). Zero walled sessions across Story 5.

**Top findings and dispositions:**

| # | Finding | Severity | Disposition | Reasoning |
|---|---------|----------|-------------|-----------|
| 1 | TC-1.3b mocks `postAuthLogin`; no direct test asserts `postAuthLogin` uses POST + `PATHS.auth.login` | Critical → **Major + accept-risk** | **deferred to pre-epic-verification cleanup** | Test plan Chunk 5 explicitly assigns 0 tests to `authApi.ts`. Composed coverage is real (compile-time `PATHS` import + `fetchClient.test.ts` asserts URL). Recommended fix: add `authApi.test.ts` with method+URL assertion, OR restructure `SignInButton.test.tsx` to intercept at the fetch layer. |
| 2 | `usePalette()` widened tech-design signature with `paletteId` field | Major | **fixed** | `PaletteContextValue` narrowed to `{ palette, setPalette }`; consumers derive `active = id === palette.id`. |
| 3 | Google Fonts CDN unconditionally linked in production `index.html` — DoD line 171 violation | Major | **fixed** | CDN `<link>` removed; self-hosted `@font-face` in `fonts.css` covers both dev and production. |
| 4 | Self-hosted `.woff2` files missing from `public/fonts/` — DoD line 171 violation | Major | **fixed** (team-lead redirected from reviewer's "defer to Story 8") | 3 WOFF2 assets committed; all valid `wOF2` magic bytes; SIL OFL 1.1 self-hosting license-permitted. |
| 5 | Tests hardcode error-code literals instead of importing from `@panel/shared` | Minor | **accept-risk** | Test plan doesn't mandate shared-constant imports for tests. |
| 6 | README dev-mode table rows for server/full-app lack port info | Minor | **accept-risk, defer to Story 7** | Story 7 owns TC-3.5a (`readme.test.ts` grep for all three commands with ports). |
| A | **Palette switcher had no collapsed state** (default + `palette-switcher-open` baselines visually identical) | Major (human-caught) | **fixed in round 2** | New compact trigger button top-right + `useState<boolean>` for open/close + click-outside/Escape dismissal + `aria-expanded`/`aria-controls`/useId paneId; ui-spec §6 row added, §7 paragraph added, §8 UA5 appended; 2 new PaletteSwitcher tests (collapsed-by-default + Escape-closes). |
| B | **Playwright baselines clipped below fold** — footer missing from 16/17 PNGs because default capture mode is viewport-only | Major (human-caught) | **fixed in round 2** | Every `toHaveScreenshot` call in `landing.spec.ts` now passes `{ animations: 'disabled', fullPage: true }`. Default-viewport PNGs 1280×800 → 1280×903; responsive 960×600 → 960×1231. **Surfaced as v2 skill gap: [`docs/v2-findings/010-playwright-fullpage-default.md`](../v2-findings/010-playwright-fullpage-default.md).** |

**Architectural observations (to carry forward for tech-design-client next revision):**

- **SignInProvider context pattern** — Landing wraps in `<SignInProvider>` to share sign-in state with HUD panels. Tech-design shows `useSignIn` as plain hook; tech-design-client should document this Story 5-introduced composition layer on next revision.
- **`persistence.ts` synchronous API** diverges from tech-design's `async` signature. Intentional Epic 1 simplification.
- **`RedirectFlash` three-source handling** — `prop` > `testBypass` > router `location.state`; `useInRouterContext()` guard. Forward-compat for Story 6.

**Cross-cutting issues filed for later stories:**

- **README.md UTF-8 BOM** — implementer prepended 0xEF 0xBB 0xBF when editing. Content preserved; Biome accepts. **Filed for pre-epic-verification cleanup**.
- **`biome.json` `!dist` pattern** doesn't match workspace subdirectories (`apps/panel/client/dist/`, `apps/panel/client/test-results/`). `pnpm build` + Playwright runs pollute the gate. **Filed for Story 8**. Suggest `!**/dist/**` + `!**/test-results/**`.

**Exact story gate commands run by orchestrator (ground truth, ran 2026-04-17T23:10 local after fix round 2 + transients cleaned):**

- `pnpm red-verify` → exit 0 (biome format 84 files; biome lint 85 files; typecheck across 3 packages clean)
- `pnpm verify` → exit 0 (68 live tests: 4 shared + 37 server + 27 client)
- `grep -rn '"link:' apps/*/package.json package.json` → 0 matches (no dep-graph regression)
- `git diff --stat` across all touched paths: APPEND-declared files (root `package.json`, `apps/panel/client/package.json`, `README.md`) verified as true appends — no overwrite regressions
- `scripts/test-e2e-placeholder.mjs` deleted per DoD; `test:e2e` script flipped to `pnpm --filter @panel/client test:e2e` (`playwright test`)
- 17 Playwright baselines committed under `apps/panel/client/tests/e2e/__screenshots__/`; dimensions validated (1280×903 default / 960×1231 responsive)
- 3 self-hosted WOFF2 font files present at valid sizes with correct `wOF2` magic bytes
- Delivery marker present in every Codex JSONL (5 sessions, 10 occurrences)
- `pnpm green-verify` confirmed GREEN post-commit after `.red-ref` rotation to Story 5's commit SHA

**UI spec compliance:**

- Components in §7 present as modules: 12/12. ✓
- Named states in §6 reachable: 9/9 + new `palette-switcher-collapsed`. ✓
- 17 Playwright screenshots matching §Verification Surface matrix. ✓
- One-way ownership contract holds (no interface redefinition; §8 UA5 is spec-authoring clarification). ✓
- DCE of testBypass in production bundle: 0 occurrences in `dist/assets/index-*.js`. ✓
- AC-1.4 empirically true (`withFetchRecorder` stub; `calls.length === 0` assertion). ✓
- **Human visual review: PASSED after fix round 2.** Caught 2 defects structural review missed — validating the skill's declared verification ceiling.

**Open risks:** none blocking; deferrals documented above with venues identified.

### Story 5 Orchestration Observations (captured for v2-findings + future handoffs)

1. **Human visual review earned its keep.** Both structural review layers graded Story 5 GREEN after fix round 1. The human eyeball caught two real defects — a missing collapsed state and a clipped footer — neither visible to structural checks. The skill's verification ceiling ("agents verify structural; visual quality is a human gate") is load-bearing, not aspirational. Future UI-scope stories must preserve this gate.

2. **Defect B was a v2 skill gap.** Both v2 skills are silent on Playwright capture mode. Playwright's default is viewport-only, which silently truncates baselines when content exceeds viewport height. Structural review cannot catch this because the screenshot exists and the clipped component also exists in code. Finding 010 recommends codifying `fullPage: true` as the default in both skill bodies.

3. **Defect A was a spec-authoring gap.** ui-spec §6 listed `palette-switcher-open` as a named state but §7 described only the expanded pane. Implementer built what the pane section described — always-visible. Neither round 1 reviewer nor Codex flagged the ambiguity. Captured as ui-spec §8 UA5. Spec-authoring lesson: if the state matrix implies transitions, the component spec must describe ALL named states, not just the canonical one.

4. **Mid-flight fix-round redirect worked cleanly.** Reviewer proposed deferring Major #4 (missing .woff2 files) to Story 8. Team-lead redirected: DoD explicitly required self-hosted fonts; deferring would leave an unmet DoD line AND Stories 6+7 with a broken packaged build. Fix landed in same fix round 1 driver alongside #2+#3; no wasted iteration. Pattern: when reviewer proposes a deferral that leaves a DoD line unmet, team-lead redirects to fix-in-cycle.

5. **Biome `!dist` pattern doesn't handle workspace subdirectories.** Both fix rounds required `git clean -fdx apps/panel/client/{dist,test-results}/` before running `pnpm verify`. Not a Story 5 defect but a lurking infrastructure issue Story 8 will bite. Fix: `!**/dist/**` + `!**/test-results/**`.

6. **Reviewer empirical reproduction continues to add value.** Round 1 reviewer ran `pnpm --filter @panel/client build` to confirm DCE empirically, `pnpm install --force --no-frozen-lockfile` to confirm no ignored-build-script warnings, and `file` to verify WOFF2 magic bytes. None surfaced surprises, but the discipline is the point.

7. **`react-router@^7` installed in Story 5's client package.json** but Story 6 scope. Reviewer spot-checked: no router code in Story 5. Dependency-only landing is cheap and Story 6 needs it; not scope creep.

8. **Implementer silent-post-completion pattern broken this run.** Orchestrator-nudge at ~23 min during impl driver reinforced cadence. Round 1 fix + round 2 fix both reported promptly. Proactive nudge on long drivers (>20 min since last status) is now the pattern.

### Story 5 — Transition Checkpoint (accepted + committed 2026-04-17)

**Cumulative test count after Story 5: 68 Vitest live + 17 Playwright baselines.** Breakdown: 4 shared (Stories 0 + 4) + 37 server (Stories 1–4) + 27 client (Story 5's 25 + 2 added in fix round 2 for PaletteSwitcher collapsed/expanded). Story 6 target: router + placeholders per test-plan Chunk 6; cumulative floor entering Story 6 is ≥ 68 Vitest live.

**Problems encountered:**
1. Round 1 reviewer found 1 Critical (downgraded) + 3 Majors + 2 Minors. All dispositioned in-cycle; one fix-round driver iteration.
2. **Human visual review caught 2 structural-review-invisible defects** (palette switcher collapsed state + Playwright footer clipping). Required unplanned fix round 2 with 2 driver iterations.
3. Biome `!dist` not matching workspace subdirectories.
4. Transient driver verdict noise (`REAL_ERROR` from Codex's in-session error count even when final gates green) — harness handled correctly.

**Impact and resolution:** all four absorbed in-cycle. Problem 2 was a methodology win — structural checks didn't find the defects, the human gate did — and surfaced as Finding 010 (v2 skill gap). Problem 3 filed for Story 8. Final gates triple-confirmed.

**Recommendations for Story 6 (client-side router + gating + placeholders):**

- Story 6 registers `/`, `/home`, `/settings` routes via React Router 7 (dep already installed). `<RequireAuth>` guard reads `isAuthenticated()` which Story 6 owns.
- `<RedirectFlash>` already handles `location.state.redirectedFrom` cleanly — Story 6 just wires the router.
- TC-2.4a passes in Story 5's `Landing.test.tsx` as belt-and-suspenders; Story 6 re-exercises in router context.
- Story 6 is a new Red commit — acceptance gate is `pnpm red-verify && pnpm verify`, not `green-verify`.
- Any new e2e screenshots must use `{ animations: 'disabled', fullPage: true }` — explicit orchestrator rule until v2 skill update lands.

**Boundary inventory after Story 5:**

| Boundary | Status | Owning Story | Change from Story 4? |
|----------|--------|--------------|----------------------|
| Client renderer | **fully implemented** (landing view + 5 palettes + sign-in handler + API client + Playwright harness + 17 baselines) | Story 5 | **advanced** (was not started) |
| React Router | dep installed; no wiring | Story 6 | dep landed |
| Twitch OAuth (`/auth/login`) | stub body + real Origin gate | Story 2 → Story 4 → Epic 2 | — |
| Twitch OAuth callback (`/oauth/callback`) | stub body + exempt gate | Story 2 → Epic 2 | — |
| Live SSE producers | stub cadence + real session gate | Story 2 → Story 4 → Epic 4a | — |
| SQLite filesystem | integrated | Story 3 | — |
| Session cookies (`iron-session`) | wired (unseal active; issue path Epic 2) | Story 4 | — |
| Twitch Helix / EventSub | not started | Epic 3 / Epic 4a | — |
| OS keychain (`keytar`) | not started | Epic 2 | — |
| Electron shell | not started | Story 7 | — |
| GitHub Actions CI | partial (docs-fallback) | Story 9 | — |

### Story 6 — Pre-Acceptance Receipt (2026-04-17)

**CLI evidence references** (2 Codex sessions — implementer + reviewer; zero fix rounds needed):

- Impl iter 1 — thread `019d9ea3-a22e-71e3-ba95-6ca535e15978`; JSONL `codex-story-6-impl.iter-1.jsonl`. Wrapper verdict `REAL_ERROR` but driver's ground-truth gate check returned exit 0; driver correctly short-circuited to GREEN and composed the impl-report. Delivered 7 files: 5 new source (`defineRoute.ts`, `routes.ts`, `router.tsx`, `RequireAuth.tsx` in `src/app/`; `HomePlaceholder.tsx`, `SettingsPlaceholder.tsx` in `src/views/`), 1 new test (`router.test.tsx`, 5 tests), 1 MODIFY (`App.tsx`).
- Reviewer Codex pass — thread `019d9eac-5b3d-7010-9aa6-ad37f229be63`; JSONL `codex-story-6-review.iter-1.jsonl`; findings `codex-story-6-findings.md`. Verdict 1 Minor (doc drift); 0 Major; 0 Critical. `--max-iterations 1` per review-mode handoff.

Delivery marker `DELIVERY_CHECK_MARKER_ECHO_7077` observed in both JSONLs (impl=2, review=3; 5 total). Zero walls, zero relaunches.

**Top findings and dispositions:**

| # | Finding | Severity | Disposition | Reasoning |
|---|---------|----------|-------------|-----------|
| 1 | `RequireAuth.tsx`'s `isAuthenticated()` missing the Epic 2 replacement comment that `tech-design-client.md` §RequireAuth Guard includes verbatim | Minor | **accepted-risk, filed for pre-epic-verification cleanup** | Behavior correct; doc drift only. DoD doesn't mandate the comment. Pre-epic cleanup venue can add a 2-line comment across all Epic 1 isAuthenticated-style stubs in one sweep. |

**Architectural observations (reviewer, logged but no change needed):**

- `defineRoute.ts` uses `createElement(RequireAuth, undefined, args.element)` because the file is `.ts` not `.tsx`. Functionally identical to the design's `<RequireAuth>{args.element}</RequireAuth>`. No drift.
- `RouteDefinition` interface is strict; no `usePalette`-style widening regression from Story 5.
- TC-2.5b genuinely registers a NEW route (`/test-gated`) via `defineRoute({ gated: true })` and proves inheritance — not a re-test of `/home`.
- Router tests use `createMemoryRouter` (not `<BrowserRouter>`), jsdom-safe, matching test-plan fixture guidance.
- `<RedirectFlash />` NOT duplicated — only the Story 5-owned instance exists. Story 6 adds no shadow implementation.
- `App.tsx` MODIFY is minimal: only the direct `<Landing />` child swap + import adjustments. `<PaletteProvider>` wrapper preserved.

**Bonus cleanup (unplanned):** Codex's rewrite of `App.tsx` removed an erroneous UTF-8 BOM that Story 5's implementer had prepended (Story 5 Pre-Acceptance Receipt filed README.md BOM for pre-epic cleanup; App.tsx had the same defect, and Story 6's write-from-scratch naturally produced BOM-free output). Biome tolerated the BOM before, but removal is a net positive. **Note for future Story 7+ handoffs:** Codex on Windows may re-introduce BOMs when APPENDing vs writing-from-scratch. Watch for it.

**Exact story gate commands run by orchestrator (ground truth, 2026-04-17T23:45 local):**

- `pnpm red-verify` → exit 0 (biome format 91 files; biome lint 92 files; typecheck across 3 packages clean)
- `pnpm verify` → exit 0 (73 live tests: 4 shared + 37 server + 32 client)
- `grep -rn '"link:' apps/*/package.json package.json` → exit 2 / 0 matches (no dep-graph regression)
- `git diff --stat` across all touched paths: `App.tsx` shows 6+ / 2− (a clean swap); 6 new source + 1 new test + log updates; no undeclared touches
- Delivery marker grep on impl + review JSONLs: 2 + 3 occurrences respectively
- Playwright baselines: `ls tests/e2e/__screenshots__/` → 17 files (unchanged from Story 5)
- `pnpm green-verify` confirmed GREEN post-commit after `.red-ref` rotation to Story 6's commit SHA

**UI spec compliance:**

- No new Playwright screenshots produced or required this story — `redirect-flash-home` and `redirect-flash-settings` baselines were captured in Story 5 via testBypass forced-state. Story 6 makes those states reachable via natural router flow; the existing baselines remain visually valid.
- One-way ownership contract intact: Story 6 does not redefine `<RedirectFlash />` or `<NavBar />`. It only produces the router context.
- `<NavBar />` gated-tab click behavior (ui-spec §7: PLAY/OPTIONS triggers `<RedirectFlash>`) is now genuinely exercisable via `<RouterProvider>`. Story 5's click handlers intact.
- Human visual review: **not required this story** — no new baselines. Story 5's visuals remain authoritative.

**Open risks:** none blocking. Epic 2 comment defer documented above with pre-epic-verification cleanup as venue.

### Story 6 Orchestration Observations (captured for v2-findings + future handoffs)

1. **Fastest story-cycle yet.** Impl driver green in iter 1 with zero fixes, reviewer clean with 1 Minor, zero fix-round drivers. Signal: the tech-design-client companion is carrying its weight — Story 6's design section included complete code for every module, so the implementer's task section was a near-direct pointer and Codex produced design-matching output on the first try.

2. **Wrapper `REAL_ERROR` verdict with ground-truth GREEN gate is an expected pattern.** First surfaced in Story 5 fix round 1; now consistently observed. Codex's internal error counter trips on benign conditions (e.g., shell command stderr noise during typechecks) that don't represent real failures. `drive-until-green.sh`'s design of checking ground-truth gates before escalating the wrapper verdict is validated by repetition. Consider upstreaming this as a Codex harness finding — the ground-truth-over-wrapper-verdict pattern is load-bearing.

3. **Team persisted across Claude Code sessions.** `TeamCreate` reported "Already leading team" on this session's start, though memory note `reference_team_directory_ephemeral` claimed team dirs are ephemeral. Two Story 5 teammates (`story-5-implementer`, `story-5-reviewer`) were still in the `config.json` member list. User caught it; team-lead `SendMessage`d both with `shutdown_request` and they acked within seconds. **Pattern to codify:** on fresh-session resumption, always read `~/.claude/teams/<team>/config.json` and shut down any teammates from prior stories before spawning this story's teammates. The memory note may need refinement from "always recreate team" to "team dir persists; check member list and shut down stale members before spawning this story's teammates".

4. **Incidental BOM cleanup on App.tsx was a bonus.** Codex rewrote App.tsx in full, producing BOM-free output. Biome had tolerated the BOM on App.tsx for Story 5's duration. This style of incidental cleanup when Codex touches a file should be watched for — in the opposite direction, Codex can also introduce BOMs when APPENDing on Windows. Future handoffs should explicitly state "no BOM; UTF-8 LF endings" when the file is expected to stay in a canonical encoding.

5. **Single-commit-per-story header update pattern holds.** Story 6's log header adds Story 5's `4220836` SHA to the prior-accepted list (safe to reference now post-Story-5-commit) but does NOT include Story 6's own SHA anywhere — that reference will land in Story 7's commit. Avoids the chicken-and-egg of in-commit SHA self-reference without needing amendment dances.

6. **Team-lead pre-acceptance gate re-run caught nothing new but validated the reviewer's authoritative re-run.** Skill discipline "run the gate yourself, don't trust reports" held. Cost is ~10 seconds for a non-UI-scope story; worth it always.

### Story 6 — Transition Checkpoint (accepted + committed 2026-04-17)

**Cumulative test count after Story 6: 73 Vitest live + 17 Playwright baselines.** Breakdown: 4 shared (Stories 0 + 4) + 37 server (Stories 1–4) + 32 client (Story 5's 27 + Story 6's 5 router tests). Story 7 target: Electron shell + full-app mode per test-plan Chunk 7; cumulative floor entering Story 7 is ≥ 73 Vitest live + 17 Playwright. Story 7 adds 1 new Vitest test (`server/src/electron/readme.test.ts` — TC-3.5a grep for dev-mode commands in README) → target 74 live.

**Problems encountered:**
1. Stale Story 5 teammates lingered in team config on fresh-session resumption. User flagged; team-lead dispatched shutdown requests; both acked within seconds. Captured as Orchestration Observation #3 and surfaces a possible memory-note update.
2. Wrapper `REAL_ERROR` verdict on impl driver despite ground-truth GREEN. Design-intended: the driver checks ground-truth gates before escalating wrapper verdicts. No action needed; captured as Observation #2.
3. Single Minor (RequireAuth Epic 2 comment). Accepted-risk and filed for pre-epic cleanup, matching the Story 5 Minor-doc-accept pattern.

**Impact and resolution:** all three absorbed in-cycle. Problem 1 motivates a memory-note refinement (team directory persists; only active agents cycle). Problem 2 validates the harness design at repetition. Problem 3 continues the established accept-doc-drift-for-pre-epic-sweep pattern.

**Recommendations for Story 7 (Electron main process + full-app mode):**

- Story 7 introduces the Electron shell: `BrowserWindow`, `app://panel` protocol, `ipcMain` handlers, Fastify-inside-main. First cross-process story of the epic. Expect more integration than unit-level testing; gate will still be `pnpm red-verify && pnpm verify` plus TC-3.5a's `readme.test.ts` grep.
- Human observed-run is required for TC-1.1b, TC-3.1a (app launch) and TC-3.2a (HMR). Schedule for after the story commit lands so the human sees the real app open.
- Tech-design-server §Electron Shell + §Window Management + §Packaging are primary reads. Test-plan Chunk 7 is small (1 test) — most of the story is observed-run.
- `@electron/rebuild` postinstall from Story 3 needs to still work with Story 7's electron-builder config. Verify no dep-graph churn.
- `@panel/server`'s main points the Electron entry. Story 7 implementer should confirm existing `package.json` shape vs design.
- README dev-mode table (deferred from Story 5 Minor #6) lands in Story 7 — implementer should add port info to ensure TC-3.5a's grep is satisfied.

**Boundary inventory after Story 6:**

| Boundary | Status | Owning Story | Change from Story 5? |
|----------|--------|--------------|----------------------|
| React Router | **wired** (createBrowserRouter mounted from App.tsx; defineRoute factory + RequireAuth guard produce client-side gate; 5 router tests green) | Story 6 | **advanced** (was dep-installed-no-wiring) |
| Client renderer | fully implemented (Story 5 view; Story 6 router context) | Story 5 + 6 | router now authoritative |
| Twitch OAuth (`/auth/login`) | stub body + real Origin gate | Story 2 → Story 4 → Epic 2 | — |
| Twitch OAuth callback (`/oauth/callback`) | stub body + exempt gate | Story 2 → Epic 2 | — |
| Live SSE producers | stub cadence + real session gate | Story 2 → Story 4 → Epic 4a | — |
| SQLite filesystem | integrated | Story 3 | — |
| Session cookies (`iron-session`) | wired (unseal active; issue path Epic 2) | Story 4 | — |
| Twitch Helix / EventSub | not started | Epic 3 / Epic 4a | — |
| OS keychain (`keytar`) | not started | Epic 2 | — |
| Electron shell | not started | Story 7 | — (next) |
| GitHub Actions CI | partial (docs-fallback) | Story 9 | — |
