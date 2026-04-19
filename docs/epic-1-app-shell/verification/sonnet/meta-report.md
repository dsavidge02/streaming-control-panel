# Epic 1 — Reviewer Meta-Report

**Author:** `sonnet-reviewer` (Claude Sonnet 4.6)
**Date:** 2026-04-18
**Scope:** Comparative synthesis of three Epic 1 phase-1 reviews
**Reports compared:**
- Opus: `docs/epic-1-app-shell/verification/opus/epic-review.md` (~37KB, 688 lines)
- Sonnet: `docs/epic-1-app-shell/verification/sonnet/epic-review.md` (~34KB, 448 lines)
- gpt-5.4: `docs/epic-1-app-shell/verification/gpt54/epic-review.md` (~27KB salvaged, 305 lines — partial, write failure)

---

## 1. Reviewer ranking

**1st: Opus** — The most complete, evidence-grounded report. Five Major findings, thirteen Minors, full AC/TC matrix, boundary inventory, full UI-spec compliance audit, and twelve "What else did I notice" observations. Identified M5 (NavBar click simulation) that neither Sonnet nor gpt-5.4 caught — the only finding that is both actionable and unique to Opus. High confidence throughout. Grade: B+.

**2nd: Sonnet** — Strong on test behavior analysis (M1 diagnosis is the most technically detailed of the three, walking through fake-timer interaction with Fastify inject). Full AC/TC coverage table. Clear coverage + DoD matrix. Weaker on UI-spec depth and "What else" breadth. Missed M2 (CLAUDE.md staleness) and M5 (NavBar). Grade: B.

**3rd: gpt-5.4 (salvaged)** — Not rankable as a complete review; five executive bullets only due to Windows DLL write failure. What survives is genuine review work (7.7M tokens consumed, 40.5K output), but the persisted artifact is a triage summary, not a full report. The one original finding (S1, `.gitattributes`/`core.autocrlf` vs Biome) is medium-confidence and unconfirmed by peers. No grade emitted. For synthesis purposes, treat gpt-5.4's S1 as a hypothesis to verify rather than a confirmed finding.

---

## 2. Per-report assessment

### 2a. Opus

**Strengths:**
- Broadest finding set: five Major, thirteen Minor, twelve deep-dive observations.
- M5 (NavBar click simulation bypass) is the single most actionable finding not shared by the other two reviewers. The NavBar currently calls `onGatedNavigate(tab.path)` to set local state rather than dispatching `useNavigate()(tab.path)` — meaning the gated-nav demo works by simulation rather than actual router traversal. Opus correctly identifies this as a spec alignment gap (ui-spec §NavBar says "triggers `<RedirectFlash>` via React Router state, then navigates") while also correctly noting that AC-2.1's TCs exercise URL navigation, not NavBar clicks, so the AC passes regardless.
- Boundary inventory is the only section where all stubs are explicitly cross-checked against the boundary log. Opus concludes cleanly that no unexpected stubs are present.
- `smoke:packaged` gate section (line 492) is the most thorough: it enumerates exactly what the smoke gate proves (main starts, Fastify binds, migrations ran, error handler pipeline works, Origin allowlist accepts `app://panel`, asar+binding survived) and what it does not (renderer UI loading).
- m7 (SMOKE_MODE env var set in `scripts/smoke-packaged.mjs` but not read in `index.ts`) is a genuine minor catch — the decisions-log describes the env var behavior aspirationally, but the shipped code uses the 30s deadline + taskkill path instead. Low severity but an honest discrepancy.
- m10 (`baseSseEventSchema` unused export) and m12 (`RedirectFlash` timer + prop-change edge case) are observations worth noting for Epic 4a.

**Weaknesses / gaps:**
- M1 diagnosis (TC-6.3a) is correct on the outcome but slightly underexplains the mechanism: Opus says the `timerMode:"fake"` branch ends the response immediately, which is the fake-path behavior, but the more interesting gap is in the `timerMode:"real"` path the test actually takes (fake timers + Fastify inject, where the initial heartbeat satisfies the assertion). The Sonnet report provides the cleaner chain of reasoning here.
- m4 (Landing `useState` + NavBar prop threading) is listed as a separate minor from M5 but is in fact the same root issue — both are resolved by a single `navigate()` call. The duplication slightly inflates the finding count.

### 2b. Sonnet (this reviewer)

**Strengths:**
- M1 technical diagnosis is the most precise of the three. Correctly identifies that `buildTestServer()` defaults to `timerMode:"real"` (not fake), so the test takes the real `setInterval` path — but then explains why the assertion `toContain("event: heartbeat")` is still satisfied by the initial unconditional emit regardless of whether the interval fires.
- M2 (root `package.json` runtime deps) and M3 (dead asarUnpack) match Opus M4 and M3 respectively — both confirmed.
- m6 (Landing `useState` + NavBar prop threading from tech-design-client perspective) and m7 (double-redundant DEV check in `testBypass.ts`) are small but genuine catches.
- m8 (smoke:packaged not in CI) is correctly framed as an acknowledged gap per decisions-log, not a surprise defect.
- Coverage and DoD table is complete and well-organized.

**Weaknesses / gaps:**
- Missed CLAUDE.md staleness entirely (Opus M2 / gpt-5.4 S4). This is one of the highest-impact findings for the project's ongoing operation — future agents onboard from CLAUDE.md and will start from a wrong current-state model.
- Missed NavBar click simulation (Opus M5). Logged m4 as a related symptom (Landing `useState`) but did not surface the behavioral consequence (PLAY/OPTIONS clicks don't navigate, contradicting ui-spec §NavBar).
- UI-spec compliance section is accurate but narrower than Opus's. Missing the `prefers-reduced-motion` observation (Opus m8) and the `baseSseEventSchema` unused export (Opus m10).
- m6 entry partially self-corrects (observes that `<Hero>` IS present, consistent with spec) — this minor finding should have been null-filed, not listed.

### 2c. gpt-5.4 (salvaged)

**Strengths:**
- S1 (`.gitattributes` / `core.autocrlf` vs Biome) is the only finding across all three reviewers that addresses the Windows-specific line-ending problem. If this is real on a fresh checkout, it is a blocker for any Windows developer who hasn't pre-configured `core.autocrlf=false`. Neither Opus nor Sonnet reproduced this — but both ran on non-fresh-checkout environments.
- S2–S5 all corroborate peer findings at high confidence. The salvaged bullets are directionally correct.
- Narrative trace (message 15) is an honest, audit-transparent account of what happened. The salvage doc is a model of how to handle partial deliverables gracefully.

**Weaknesses / gaps:**
- No grade, no AC/TC matrix, no test quality section, no boundary inventory, no UI-spec section, no detailed Minors. These aren't criticism of gpt-5.4's work — they are the known consequences of the DLL write failure — but they mean the report cannot be used as a standalone verdict.
- S3 (Windows-only packaging scripts vs cross-OS doc claims) has medium confidence but is the weakest salvaged finding: the other two reviewers partially corroborate the packaging-doc drift but neither surfaced the "docs imply cross-OS" angle. This needs a direct read of `README.md` §Build + `tech-design-server.md` §Packaging before accepting.
- gpt-5.4 read the peer review outputs during its session (confirmed by JSONL narrative at lines 301-302). This cross-contamination is a minor concern for S2/S4/S5 — some of what Codex surfaced may reflect peer-review reading rather than independent analysis. S1 and S3 are the genuinely independent signals.

---

## 3. Synthesis guidance

### Which findings to accept into the verification record

**Accept at high confidence (3-of-3 or 2-of-3 independent corroboration):**

| Finding ID | Canonical source | Description |
|-----------|-----------------|-------------|
| TC-6.3a weak | Opus M1, Sonnet M1, gpt S2 | Heartbeat cadence unverified — assertion satisfied by initial emit |
| CLAUDE.md stale | Opus M2, gpt S4 | §"Current state" describes Story 0/1 state, not Epic 1 complete |
| tech-design drift | Opus M3, gpt S5 | `PATHS` shape, stale snippets, file-count mismatch across spec companions |
| Root `package.json` deps | Opus M4, Sonnet M2 | Packaging workarounds that need validation/removal lifecycle |
| Dead asarUnpack | Opus M3b, Sonnet M3 | `.pnpm/` pattern is dead under hoisted linker |

**Accept at high confidence (Opus-only but well-evidenced):**

| Finding ID | Source | Description |
|-----------|--------|-------------|
| NavBar click simulation | Opus M5 | NavBar calls `onGatedNavigate` instead of `navigate()` — simulation only |
| `smoke:packaged` SMOKE_MODE dead | Opus m7 | Env var set in script, not read in main process |
| `baseSseEventSchema` unused | Opus m10 | Dead export — candidate for Epic 4a annotation or pruning |
| `prefers-reduced-motion` missing | Opus m8 | ui-spec §8 UQ4 commitment unfulfilled |

**Accept at medium confidence (Sonnet-only, well-evidenced):**

| Finding ID | Source | Description |
|-----------|--------|-------------|
| testBypass double-DEV check | Sonnet m7 | Redundant `!import.meta.env.DEV` guard — harmless but noisy |
| `paletteApi.ts` path deviation | Sonnet §What else #3 | Actual path is `palette/paletteApi.ts` not `api/paletteApi.ts` |

**Investigate before accepting (gpt-5.4 only, medium confidence):**

| Finding ID | Source | Description |
|-----------|--------|-------------|
| `.gitattributes` / CRLF vs Biome | gpt S1 | `pnpm verify` red on Windows fresh checkout due to line-ending conflict |
| Windows-only packaging scripts | gpt S3 | README/docs claim host-OS packaging but scripts use Win32 APIs |

### Recommended pre-Epic-2 cleanup actions (priority order)

1. **Fix CLAUDE.md `§Current state`** — update to Epic 1 complete, correct test counts, remove stale RESTART-INSTRUCTIONS.md reference. Impact: every future agent onboards correctly.
2. **Validate and remove root `package.json` runtime deps** — throwaway branch: remove deps, run `pnpm install && pnpm package && pnpm smoke:packaged`. If green, land before Epic 2 Story 0.
3. **Fix TC-6.3a** — assert ≥2 heartbeat events after advancing 30+ seconds, or add a count assertion.
4. **Fix NavBar click navigation** (Opus M5) — dispatch `useNavigate()(tab.path)` and let `RequireAuth`/`Navigate` produce the redirect. Alternatively, update ui-spec §NavBar to describe simulation behavior.
5. **Update tech-design companion docs** — `PATHS` shape, `paletteApi.ts` path, file count in `test-plan.md`.
6. **Investigate gpt S1** — on a fresh Windows checkout with default git config, run `pnpm verify` and observe whether Biome reports formatting errors. If confirmed, add `* text=auto eol=lf` to `.gitattributes`.

---

## 4. Cross-report findings

### Unanimous findings (all three reviewers)

**TC-6.3a weak coverage** is the only finding that all three reviewers independently identified before any cross-contamination. It is the highest-confidence finding in the verification record.

### Bi-lateral findings

- **CLAUDE.md staleness** — Opus + gpt-5.4. Sonnet missed it entirely.
- **Root `package.json` deps** — Opus + Sonnet. gpt-5.4 partial (S5 mentions test-plan drift but not deps specifically).
- **Dead asarUnpack `.pnpm/` pattern** — Opus + Sonnet (both called it out independently with the same decisions-log Decision #6 citation).
- **Tech-design companion drift** — Opus + gpt-5.4. Sonnet called out some file-layout minors but not the full scope.

### Findings unique to one reviewer

| Reviewer | Unique finding | Confidence | Action |
|---------|---------------|-----------|--------|
| Opus | M5 NavBar click simulation | High | Accept — well-evidenced against ui-spec |
| Opus | m7 SMOKE_MODE dead env var | High | Accept — directly verifiable |
| Opus | m8 `prefers-reduced-motion` missing | Medium | Accept — ui-spec UQ4 commitment is clear |
| Opus | m10 `baseSseEventSchema` unused | Medium | Accept — easy to verify with grep |
| Opus | m11 cookie secret literal leakage risk | Low | Log only |
| Opus | m12 RedirectFlash timer edge case | Low | Log only |
| Sonnet | m7 double-DEV check | Medium | Accept — harmless, clean up in pre-Epic-2 pass |
| gpt-5.4 | S1 `.gitattributes`/CRLF vs Biome | Medium | **Verify before accepting** |
| gpt-5.4 | S3 Windows-only packaging scripts | Medium | Verify before accepting |

---

## 5. Severity calibration

### Are the grades consistent?

- **Opus: B+** — Reflects that the codebase is coherent and all ACs are covered, but five non-trivial Majors (especially CLAUDE.md staleness and NavBar simulation) are genuine concerns.
- **Sonnet: B** — Slightly more conservative; the same core issue set but without M2 (CLAUDE.md) or M5 (NavBar), which deflates the actual severity.
- **gpt-5.4: N/A** — No grade emitted.

**Consensus grade: B+** aligns with Opus. Sonnet's B was calibrated without two of the most meaningful Major findings, making it slightly under-severity. The combined finding set (5 Major, 13+ Minor) warrants B+ rather than pure B.

### What was over-severity?

Sonnet's M3 (dead asarUnpack) is arguably a Minor in scope — it's a dead YAML line, not a behavior gap. Opus demotes the equivalent finding to M3b (part of tech-design drift), which is more appropriate severity. Similarly, Sonnet's m6 (Hero import observation) self-corrects in the text and should have been omitted.

### What was under-severity?

CLAUDE.md staleness is the strongest case for a higher Major rating than any reviewer gave it. The file explicitly instructs readers to start there; future agents onboarding from the spec will have a wrong current-state model for an entire epic's duration. Both Opus and gpt-5.4 correctly flagged it as Major; Sonnet's miss was the calibration gap.

NavBar simulation (Opus M5) could be argued as Critical for a UI/visual-behavior reviewer since it means the living demo of the gated-nav flow is not exercised by the router at all. Opus correctly keeps it at Major by noting the ACs are satisfied through other verification surfaces (URL navigation tests).

---

## 6. What all three missed

The following items are either missed or underweighted across all three reports:

### 6a. No end-to-end error path test

None of the three reviewers flagged this with Major severity: there is no test that exercises the full `POST /auth/login` → server error envelope → renderer `fetchClient.ts` `safeParse` → `messageFor(code)` → `<ErrorEnvelopeCard>` pipeline using a real server response. Every layer is tested in isolation, and the Playwright test uses `testBypass.ts` to force the renderer state rather than a real server round trip. This seam is the primary trust boundary for Epic 2+ auth work. Opus mentioned it in §What else observation 9 but not as a graded finding.

**Recommendation:** Add an integration test (Playwright or Vitest with MSW) in Epic 2's first story that exercises this path end-to-end before Epic 2 lands real auth behavior.

### 6b. `scripts/patch-local-asar-cli.mjs` in `postinstall` unreviewed

All three reviewers noted the `scripts/` directory but none investigated `patch-local-asar-cli.mjs`. This script runs in `postinstall` to patch the asar CLI. This is a monkey-patch at install time — the kind of workaround that (a) may break on node version upgrades, (b) is invisible to reviewers who see a clean `pnpm install`, and (c) could be removable if the asar version is updated. Worth a one-pass review before Epic 2.

### 6c. `codex/` harness ships untested

Opus mentioned this in §What else observation 10 but none of the three promoted it to even a Minor finding. The `scripts/codex/` harness (outer driver, prompt composer, retry/wall logic) is now load-bearing for Epic 2+ implementation — it is production infrastructure for the team. Zero test coverage. The counter-argument is that it's orchestration tooling outside the app's own test surface, but a broken harness silently corrupts future implementation runs (as the gpt-5.4 session failure itself demonstrated).

### 6d. `tools/ci/workflow.test.ts` path-resolution fragility

Opus m13 noted the test count reconciliation but none of the three flagged that `workflow.test.ts` resolves `.github/workflows/ci.yml` via a relative path from `import.meta.url`. This is a structural test that would silently break if the file is relocated. Low probability but worth a comment in the test.

### 6e. Cookie secret fallback in production-safe form

Opus m11 mentioned this but as a callout-only. The `config.ts` fallback `'dev-only-change-in-epic-2-___________'` is a padded literal — harmless in Epic 1 (no session sealing), but if Epic 2 implements auth without adding a proper cookie-secret injection, every installation ships with the same literal key. Recommend requiring `PANEL_COOKIE_SECRET` env var with `app.isPackaged` gate in Epic 2's first story.

---

## 7. Process observations (v2 findings signal)

### Reviewer cross-contamination risk

gpt-5.4 explicitly read the Opus and Sonnet review outputs during its session (JSONL narrative events 301-302). This means S2, S4, and S5 from gpt-5.4 may reflect peer-review synthesis rather than independent verification. For a meta-report this is manageable (we know which findings are independent), but for future review orchestration runs, the three reviewers should be given explicit instructions to complete their evidence pass and draft their findings before reading peer outputs — or should be isolated entirely until they have a complete draft.

### Partial delivery from salvaged sessions

The gpt-5.4 salvage demonstrates that a useful but incomplete review is still valuable: S1 (CRLF/Biome) is the most original single finding across all three reports, and it came from the salvaged session. Future orchestration should include a "salvage and relay" path that recovers the final `agent_message` when write failures occur, rather than treating the session as a total loss. The gpt54 salvage doc is a model for how to do this.

### Sonnet's missed CLAUDE.md finding

The CLAUDE.md staleness finding is the most operationally significant finding in the review set (wrong current state corrupts future agent onboarding), and Sonnet missed it entirely while Opus and gpt-5.4 independently caught it. The likely cause: Sonnet read CLAUDE.md early in the session as orientation context but did not re-evaluate it as a *target* of the review. Future reviewer prompts should explicitly instruct: "treat `CLAUDE.md` and companion docs as implementation deliverables subject to the same staleness check as test files."

---

## 8. Consolidated finding inventory

The table below merges all three reports into a single deduplicated finding list. Status: **Accept** = take into the pre-Epic-2 cleanup backlog; **Investigate** = needs verification; **Log** = noted but no action required before Epic 2.

| ID | Description | Severity | Status | Source |
|----|-------------|----------|--------|--------|
| TC-6.3a | Heartbeat cadence unverified (initial emit satisfies assertion) | Major | Accept | All 3 |
| CLAUDE.md | §Current state stale — describes S0/S1 state | Major | Accept | Opus, gpt |
| PATHS shape | `live.events` vs `liveEvents` spec drift in tech-design-server.md | Major | Accept | Opus, gpt |
| Root deps | 11 runtime deps in root `package.json` (packaging workaround) | Major | Accept | Opus, Sonnet |
| Dead asarUnpack | `.pnpm/` pattern dead under hoisted linker | Major | Accept | Opus, Sonnet |
| NavBar navigate | NavBar clicks simulate redirect rather than dispatching `navigate()` | Major | Accept | Opus only |
| CRLF vs Biome | `pnpm verify` red on fresh Windows checkout | Major | Investigate | gpt only |
| Windows pkg docs | README/tech-design describe cross-OS; scripts are Win32-only | Major | Investigate | gpt only |
| buildServer tautology | Second test calls `listen` directly — not via `startServer` | Minor | Accept | Opus, Sonnet |
| Near-identical SSE tests | TC-6.3b + TC-2.2a + TC-8.1a all identical | Minor | Log | Sonnet |
| SMOKE_MODE dead | Env var set in script, not read in main process | Minor | Accept | Opus |
| `prefers-reduced-motion` | ui-spec UQ4 commitment unfulfilled | Minor | Accept | Opus |
| `baseSseEventSchema` | Unused export — prune or annotate for Epic 4a | Minor | Accept | Opus |
| SignInProvider not in spec | Context pattern added beyond tech-design | Minor | Log | Opus |
| Cookie secret literal | Fallback literal ships if Epic 2 doesn't add proper injection | Minor | Accept | Opus |
| testBypass double-DEV | Redundant guard line | Minor | Accept | Sonnet |
| `paletteApi.ts` path | Actual path differs from spec path | Minor | Accept | Sonnet |
| Test plan file count | `tools/ci/` row missing from per-file matrix | Minor | Accept | Opus |
| patch-asar postinstall | Unreviewed monkey-patch script in `postinstall` | Minor | Investigate | All missed |
| E2E seam test | No end-to-end error path test across full stack | Minor | Accept | All missed |

---

*End of meta-report.*
