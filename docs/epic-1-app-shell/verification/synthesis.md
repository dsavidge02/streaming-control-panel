# Epic 1 — Orchestrator Synthesis

**Date:** 2026-04-18
**Epic state:** merged to `main` @ `6df71f8` (PR #1)
**Reviewer set:** Opus (Claude), Sonnet (Claude), gpt-5.4 (Codex salvaged), gpt-5.3-codex (skipped per skill fallback — Windows PowerShell tool-runtime incompatibility for that specific model)
**Phase 1 reports:** `verification/{opus,sonnet,gpt54}/epic-review.md`
**Phase 2 meta-reports:** `verification/{opus,sonnet}/meta-report.md`

---

## Cross-reference table

| # | Finding | Opus | Sonnet | gpt-5.4 | Confidence | Consensus severity |
|---|---------|:---:|:---:|:---:|---|---|
| 1 | TC-6.3a heartbeat cadence test tautological — assertion satisfied by initial emit, interval never verified | M1 | M1 | S2 | **Triply confirmed — highest** | Major |
| 2 | `CLAUDE.md §Current state` materially stale — describes Story 0/1 state, misleads future agents | M2 | — | S4 | **Doubly confirmed (Sonnet missed)** | Major |
| 3 | Tech-design companion drift (PATHS shape, file tree, stale packaging snippets, paletteApi path, Hero import) | M3 | m1, m6 (partial) | S5 | **Triply confirmed** | Major |
| 4 | Root `package.json` carries 7–11 runtime deps from pre-hoisted workaround; Decision #9 flagged removable | M4 | M2 | — | **Doubly confirmed** | Major |
| 5 | Dead `asarUnpack` pattern (`.pnpm/**/better-sqlite3/**/*`) matches nothing under hoisted pnpm | (in M3) | M3 | — | **Doubly confirmed** | Major |
| 6 | `buildServer.test.ts` second test calls `listen` directly rather than via `startServer` — tautology | m1 | m4 | — | **Doubly confirmed** | Minor |
| 7 | NavBar PLAY/OPTIONS clicks do NOT dispatch `navigate()` — only set local redirect-flash state; ui-spec §NavBar violated | **M5** | — | — | Opus only — verify | Disputed Major (Opus meta: downgrade; Sonnet meta: keep Major) |
| 8 | `.gitattributes`/`core.autocrlf` vs Biome disagreement — `pnpm verify` red on fresh Windows checkout | — | — | **S1** | gpt-5.4 only — **needs reproduction** | Potentially Critical on Windows |
| 9 | Packaging scripts Windows-only while README/tech-design imply cross-OS flow | — | — | S3 | gpt-5.4 only — needs doc citation | Major |
| 10 | `smoke:packaged` `SMOKE_MODE=1` env var set in script but never read in `index.ts` | m7 | — | — | Opus only | Minor |
| 11 | `prefers-reduced-motion` CSS not implemented — ui-spec §8 UQ4 commitment unfulfilled | m8 | — | — | Opus only | Minor |
| 12 | `baseSseEventSchema` exported from `shared/sse/events.ts` but unused anywhere | m10 | — | — | Opus only | Minor |
| 13 | `SignInProvider` context pattern added beyond tech-design spec (spec had only `useSignIn` hook) | m3 | (in interface §) | — | Opus primary | Minor |
| 14 | `testBypass.ts` has redundant `!import.meta.env.DEV` check — `isTestBypassEnabled()` already covers it | — | m7 | — | Sonnet only | Trivial |
| 15 | `paletteApi.ts` actual path is `palette/paletteApi.ts`, spec says `api/paletteApi.ts` | — | (§what else #3) | — | Sonnet only | Minor |
| 16 | Three near-identical 401 tests in `liveEvents.test.ts` (TC-6.3b + TC-2.2a + TC-8.1a) | — | m2 | — | Sonnet only — spec-directed, accept | None |
| 17 | `pnpm rebuild:electron` runs on every `pnpm start` — 5-15s DX latency | — | m5 | — | Sonnet only | Trivial |
| 18 | `smoke:packaged` not wired into CI workflow — packaging regressions can merge | (noted) | m8 | — | Both — accepted deferral per decisions-log #9 | None (accepted risk) |
| 19 | `RedirectFlash` 2400ms timer edge case on prop change | m12 | — | — | Opus only — low risk | Trivial |
| 20 | Cookie secret fallback literal `'dev-only-change-in-epic-2-___________'` — Epic 2 risk | m11 | (§what all missed #6e) | — | Opus primary, Sonnet meta amplified | Minor |
| 21 | `braindump.md` untracked but not gitignored — private notes could ship | m12 | — | — | Opus only | Trivial |
| 22 | Test plan file-count reconciliation off by one (tools/ci row missing) | m13 | (§coverage) | — | Opus primary | Trivial |
| 23 | `scripts/patch-local-asar-cli.mjs` postinstall monkey-patch unreviewed | — | (§what all missed #6b) | — | Sonnet meta only | Minor — investigate |
| 24 | `dev.ts` / `resolveUserDataDbPath` fallback writes to `%TEMP%` indefinitely; no cleanup | m6 | — | — | Opus partial, Opus meta amplified | Trivial |

### What all three reviewers missed (Opus meta §What all missed)

- A1. **No reviewer ran the test suite** against HEAD `6df71f8` — all three trusted the team-impl-log's claimed counts. Current green state is inferred, not independently verified.
- A2. **`.red-ref` state after PR #1 merge** — log hadn't rotated it post-PR; next TDD cycle may start from a broken baseline.
- A3. **CI workflow `on.push` absence** — AC-5.5 "CI does not run on main push" is structurally verified only indirectly; a trivial regression adding `on: push:` would pass the Story 9 structural tests.
- A4. **`apps/panel/client/src/index.ts`** — file presence flagged in multiple reports; none verified it doesn't override the intended Vite entry.
- A5. **Palette hex values** not cross-checked against `docs/references/neo_arcade_palettes.jsx` — ui-spec §1 commits to verbatim reproduction.
- A6. **`scripts/codex/` harness untested** — now load-bearing for Epic 2+ implementation.
- A7. **No end-to-end integration test** exercises `POST /auth/login` → error envelope → renderer error card through a real server round trip.

---

## Severity assessment (orchestrator judgment)

Claude reviewers were calibrated B+/B. gpt-5.4 did not emit a grade. Meta-reports disagreed on consensus grade (Opus meta: B; Sonnet meta: B+).

**Orchestrator grade: B+** — Epic 1 ships. All 38 ACs have demonstrable verification surfaces; all 54 TCs mapped; 77 Vitest + 17 Playwright + 1 smoke gate. The substrate (central registrar, Origin+session pre-handler, typed error envelope, data-layer bootstrap, `app://panel` protocol, packaging pipeline with hoisted linker) is coherent and Epic 2+ can inherit it cleanly. Story 8's research-backed root-cause fix (`node-linker=hoisted`) eliminated three classes of observed-run packaging defects.

What keeps it out of A: test-quality gap on SSE cadence (M1/Finding #1 — triply confirmed); doc drift (Findings #2, #3); pnpm-symlink workaround debt (#4, #5); one visible spec-ui-behavior gap on NavBar (#7, disputed); one potentially-blocking-for-new-Windows-contributors item that needs reproduction (#8).

No Criticals. Epic 1 is not being re-opened — fixes target pre-Epic-2 cleanup.

---

## Categorized fix list (for human approval)

### Must-fix before Epic 2 starts (3 items)

1. **CLAUDE.md §Current state rewrite** (Finding #2) — update to Epic 1 complete, 77 + 17 + 1 test counts, PR #1 @ `6df71f8` merged, stories 0–9 accepted. Delete stale `RESTART-INSTRUCTIONS.md` reference (and the file itself — already slated).
   - *Why must:* future agents onboarding from CLAUDE.md start with a wrong current-state model for an entire epic's planning horizon.
2. **TC-6.3a cadence fix** (Finding #1) — assert ≥2 heartbeat events after advancing `HEARTBEAT_INTERVAL_MS * 2`, or advance 14s → 0 events then 16s → 1 event to specifically verify the 15s interval.
   - *Why must:* the test exists and passes; a broken `setInterval` would ship silently. This is the only triply-confirmed test-quality gap.
3. **Investigate gpt-5.4 S1** (Finding #8) — on a fresh Windows checkout with default git config (`core.autocrlf=true`), run `pnpm verify` and observe whether Biome reports formatting errors.
   - *Why must:* if reproducible, this is a blocker for any new Windows contributor's onboarding. Fix is one line (`* text=auto eol=lf` in `.gitattributes`), but confirming severity needs reproduction.
   - *If irreproducible:* demote to Trivial config hygiene.

### Should-fix in pre-Epic-2 cleanup (9 items)

4. **Root `package.json` runtime deps removal** (Finding #4) — throwaway branch: remove all 7–11 packaging-workaround deps, run `pnpm install && pnpm package && pnpm smoke:packaged`. If green, land the cleanup. If not, annotate with Decision #9 pointer explaining why hoisting alone was insufficient.
5. **Dead asarUnpack pattern prune** (Finding #5) — remove `node_modules/.pnpm/**/node_modules/better-sqlite3/**/*` line from `electron-builder.yml`.
6. **Tech-design doc refresh** (Finding #3) — diff each `tech-design-*.md` §Interface Definitions against actual exports; fix `PATHS` shape (flat `liveEvents` → nested `live.events`), `paletteApi.ts` path (`api/` → `palette/`), dead `test-e2e-placeholder.mjs` snippet, dead asarUnpack in packaging §, file-tree consolidation (`envelope.ts` merged into `codes.ts`).
7. **NavBar click navigation** (Finding #7) — dispatch `useNavigate()(tab.path)` and let `RequireAuth`/`<Navigate>` produce the redirect flash via router state. Alternatively, update ui-spec §NavBar to describe the current simulation-only behavior. Either alignment, not both.
8. **buildServer.test.ts second test** (Finding #6) — refactor to `vi.spyOn(result.app, 'listen')` then call `startServer()` so the test proves the config→listen wiring rather than re-asserting the caller's own arguments.
9. **Windows-only packaging scripts doc alignment** (Finding #9) — read `README.md` + `tech-design-server.md` §Packaging; either widen `.mjs` scripts to branch on `process.platform` OR scope Epic 1 packaging to Windows-only in docs explicitly, deferring cross-OS to a post-M3 release-engineering epic.
10. **`smoke:packaged` SMOKE_MODE** (Finding #10) — either wire `process.env.SMOKE_MODE === '1'` handling into `apps/panel/server/src/index.ts` for clean quit on `did-finish-load`, OR remove `env: { SMOKE_MODE: '1' }` from `scripts/smoke-packaged.mjs` and the aspirational description from decisions-log.
11. **`prefers-reduced-motion` implementation** (Finding #11) — add `@media (prefers-reduced-motion: reduce)` rules in `fonts.css` / marquee CSS to freeze marquee translation + remove hover translations; scanlines remain per ui-spec §8 UQ4.
12. **`scripts/patch-local-asar-cli.mjs` review** (Finding #23) — one-pass read; confirm whether the asar-CLI bug being patched has an upstream fix in a later asar version; if so, upgrade asar and delete the monkey-patch + postinstall hook.

### Trivial — don't skip because small (8 items)

13. **`testBypass.ts` redundant DEV check** (Finding #14) — remove `if (!import.meta.env.DEV) return null;` on line 32.
14. **`baseSseEventSchema` unused export** (Finding #12) — either delete the export (prune) or add a one-line comment "retained as Epic 4a extension seam."
15. **`braindump.md`** (Finding #21) — add to `.gitignore` to prevent accidental `git add .` inclusion.
16. **`test-plan.md` tools/ci row** (Finding #22) — add the 2-test row for `tools/ci/workflow.test.ts` to the per-file matrix; reconcile 77 Vitest total.
17. **`dev.ts` / `%TEMP%` cleanup** (Finding #24) — add standalone-dev warning to README noting the tmpdir fallback path, OR add cleanup on dev-server shutdown.
18. **Delete `docs/epic-1-app-shell/RESTART-INSTRUCTIONS.md`** — stale since Story 0 accepted (already slated per CLAUDE.md). Bundle with Finding #2 fix.
19. **CI workflow `on.push` structural test** (Finding A3) — add one-line assertion to `tools/ci/workflow.test.ts` that `workflow.on.push` is absent.
20. **`.red-ref` state verification post-PR-1** (Finding A2) — check `.red-ref` file content; rotate to `6df71f8` if stale; confirm `pnpm green-verify` stays green.

### Verification gate items (run once before accepting epic)

- V1. Run `pnpm install && pnpm red-verify && pnpm verify && pnpm verify-all` locally on `main` @ `6df71f8` — confirm 77 Vitest + 17 Playwright green (Finding A1: no reviewer verified this independently).
- V2. Run `pnpm package && pnpm smoke:packaged` — confirm packaged boot-verification still green.
- V3. Cross-check the 5 palette hex values in `apps/panel/client/src/palette/tokens.ts` (or wherever they live) against `docs/references/neo_arcade_palettes.jsx` — Finding A5.
- V4. Verify `apps/panel/client/index.html` declares `/src/main.tsx` as entry, not `/src/index.ts` — Finding A4.

### Deferred / accepted risk (not fixing pre-Epic-2)

- **`smoke:packaged` not in CI** (Finding #18) — accepted deferral per decisions-log #9; post-M3 release-engineering epic.
- **`SignInProvider` beyond spec** (Finding #13) — defensible refactor; log in decisions-log.
- **Three near-identical 401 tests** (Finding #16) — spec-directed per test-plan's per-TC-per-test mapping; address in Epic 2 test-plan evolution.
- **`pnpm rebuild:electron` DX latency** (Finding #17) — Epic 2 optimization opportunity with cached ABI check.
- **`RedirectFlash` timer edge case** (Finding #19) — callout only; practically guarded by `key` prop remount.
- **Cookie secret env-var injection** (Finding #20) — Epic 2 Story 0 responsibility (first story to issue session cookies).
- **`scripts/codex/` harness tests** (Finding A6) — orchestration tooling, not product code; defer unless harness failure modes multiply.
- **End-to-end server→error-card test** (Finding A7) — Epic 2 Story 0 responsibility.

---

## UI spec compliance — human visual review surface

Per the skill's v2 UI-spec verification ceiling: agents verified structural compliance (components named in spec exist, named states reachable, tech-design identifiers resolve). Visual quality remains a human gate.

**17 Playwright baselines** at `apps/panel/client/tests/e2e/__screenshots__/` covering:

- 5 × `landing-default-{amber,beacon,cream,monochrome,night}.png` (all palettes)
- 5 × `landing-sign-in-error-not-implemented-{amber,beacon,cream,monochrome,night}.png` (501 envelope across palettes)
- 1 × `landing-sign-in-pending-amber.png`
- 1 × `landing-sign-in-error-origin-amber.png` (403)
- 1 × `landing-sign-in-error-server-amber.png` (500)
- 1 × `landing-redirect-home-amber.png` (redirect flash /home → /)
- 1 × `landing-redirect-settings-amber.png` (redirect flash /settings → /)
- 1 × `landing-palette-switcher-open-amber.png` (switcher expanded)
- 1 × `landing-default-amber-responsive-960x600.png` (minimum viewport)

User already performed human visual review during Story 5 acceptance (per team-impl-log). No new UI behavior landed in Stories 6–9 that would invalidate those baselines. No new human visual review required unless Finding #7 (NavBar click fix) or Finding #11 (prefers-reduced-motion) land changes that could affect the baselines — in which case regenerate + re-review.

---

## Recommended sequencing

1. **Human approves/modifies this fix list** (now).
2. **Pre-verification cleanup batch** — implement approved Must-fix + Should-fix + Trivial items as one bundled story cycle (implementer teammate with Codex CLI → reviewer teammate with Codex CLI → orchestrator final check). Commit as `fix: pre-verification cleanup`.
3. **Run verification gates V1+V2** (orchestrator runs directly).
4. **Epic 1 acceptance commit.** Update team-impl-log state to `COMPLETE`.

---

*Prepared by orchestrator synthesis per ls-team-impl-v2 §Epic-Level Verification Phase 3. Approval by human required before dispatching any fix batch.*
