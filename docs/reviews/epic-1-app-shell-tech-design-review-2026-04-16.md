# Epic 1 Tech Design Review

Reviewed artifact set:

- `C:\github\streaming-control-panel\docs\epic-1-app-shell\tech-design.md`
- `C:\github\streaming-control-panel\docs\epic-1-app-shell\tech-design-main.md`
- `C:\github\streaming-control-panel\docs\epic-1-app-shell\tech-design-renderer.md`
- `C:\github\streaming-control-panel\docs\epic-1-app-shell\test-plan.md`
- `C:\github\streaming-control-panel\docs\epic-1-app-shell\ui-spec.md`

Alignment checked against:

- `C:\github\streaming-control-panel\docs\epic-1-app-shell\epic.md`
- `C:\github\streaming-control-panel\docs\architecture.md`
- `C:\Users\dsavi\.codex\skills\ls-tech-design-v2\SKILL.md`

Review lens: `ls-tech-design-v2` readiness, with emphasis on Config B coherence, top-tier surface inheritance, TC-to-test traceability, and whether the new UI companion is actually tied into the whole design.

## Overall Assessment

`NOT READY` for handoff yet.

The artifact set is close to the intended `ls-tech-design-v2` shape. It uses the correct Config B split (`tech-design.md` index plus two domain companions), keeps `test-plan.md` separate, and includes a real `ui-spec.md` companion. The documents also do a good job inheriting the architecture's top-tier surfaces instead of silently inventing a parallel system model.

The remaining issues are mostly cross-document coherence problems. The design currently disagrees with itself on palette persistence, does not carry the `PANEL_PORT` decision through the renderer boundary, leaves the UI-spec verification path partially disconnected from the executable test plan, and drifts from the epic's package/dev-command vocabulary without recording that as a deliberate deviation.

## Strengths

- The output structure correctly follows the v2 skill: index, two companion design docs, test plan, and UI companion.
- The index is functioning as an actual decision record rather than a shallow table of contents.
- The design inherits the tech-arch top-tier surfaces cleanly and uses them as organizing boundaries.
- The renderer companion and UI spec are meaningfully connected; the UI companion is not just decorative prose.
- The test plan is substantial and does real TC traceability work instead of staying generic.

## Findings

1. **[P1] The `PANEL_PORT` override is not designed end-to-end, so the artifact set breaks its own runtime decision.**

   References:

   - `tech-design.md` D11
   - `tech-design-main.md` sections on Server Binding / config
   - `tech-design-renderer.md` `resolveServerUrl()`
   - `ui-spec.md` `SystemStatusPanel`

   The index and main companion explicitly allow a server bind override via `PANEL_PORT`, but the renderer still hardcodes `http://localhost:7077` for API calls. That means the moment a developer uses the documented override, the renderer and server no longer agree on where the API lives. The UI spec also says the HUD should show the overridden port, which reinforces that this was meant to be a real cross-system decision, not a server-only detail.

   Why this matters: this is not just wording drift. It is a broken contract between the main-process and renderer companions. A Tech Lead or implementer following the docs literally would ship an override that cannot work from the UI.

   Recommended fix: either remove the override entirely from Epic 1 and defer it, or carry it through the full boundary by defining how the renderer discovers the active server origin in both standalone and Electron modes.

2. **[P1] Palette persistence has two contradictory sources of truth across the design set.**

   References:

   - `tech-design.md` D9 and Context
   - `tech-design-main.md` Baseline Migration / `install_metadata`
   - `tech-design-renderer.md` Palette persistence section
   - `test-plan.md` palette tests

   The index and main companion say Epic 1 persists palette preference in SQLite via `install_metadata.preferred_palette`, and the main companion even justifies the column by saying the palette switcher writes there. The renderer companion and tests, however, say Epic 1 uses `localStorage`, with server-backed syncing only arriving in Epic 2+. Those are different implementations, different test surfaces, and different ownership models.

   Why this matters: this is the biggest internal contradiction in the current design. It changes what Story 3 and Story 5 are actually building, what the migration is for, and whether the UI companion's persistence language is true.

   Recommended fix: pick one source of truth for Epic 1 and update all five artifacts to match. If the choice is `localStorage` in Epic 1, then remove the SQLite-persistence claims from the index/main companion. If the choice is SQLite in Epic 1, then the renderer/test plan need real API and persistence wiring instead of localStorage-only tests.

3. **[P2] The UI companion's verification strategy is not fully integrated into the actual delivery plan.**

   References:

   - `ui-spec.md` Verification Surface / Playwright setup spike
   - `tech-design.md` Verification Scripts / Story 5 summary
   - `test-plan.md` Playwright notes and chunk breakdown
   - `tech-design-main.md` CI section

   `ui-spec.md` makes Playwright screenshot capture the default verification surface and introduces a Story 5 spike, state forcing, screenshot outputs, and CI artifact upload. But the index still treats `test:e2e` as a placeholder, the test plan says Playwright ships later, and the CI design only runs `pnpm verify` with no story-level integration of the screenshot path.

   Why this matters: under `ls-tech-design-v2`, the UI companion is supposed to tie the design together, not sit beside it. Right now the visual verification path is specified, but it is not fully adopted by the executable plan.

   Recommended fix: either fully adopt the Playwright path in Story 5 / `test-plan.md` / verification scripts, or explicitly downgrade it to a deferred follow-up and remove the "default verification surface" language from the UI spec.

4. **[P2] The package naming and dev-command vocabulary drift from the epic without being surfaced as an intentional deviation.**

   References:

   - `epic.md` AC-3.3 / AC-3.4 / scope text
   - `tech-design-main.md` workspace layout
   - `tech-design-renderer.md` package layout and standalone Vite command

   The epic still speaks in `client` / `server` terms and names `pnpm --filter client dev` and `pnpm --filter server dev` as explicit contracts. The tech design renames those packages to `renderer` / `main` and documents `pnpm --filter renderer dev`, while never establishing the equivalent `pnpm --filter main dev` story with the same clarity. This may be a better package vocabulary, but it is still a deviation from the epic's contract language.

   Why this matters: it creates churn for README expectations, story derivation, and test-plan wording. It also undermines the index's otherwise strong "Issues Found" discipline because this drift is real and not documented there.

   Recommended fix: either align the tech design back to the epic's package/command vocabulary, or add this as an explicit deviation in `tech-design.md` and normalize the artifact set around the new names.

## Missing Elements

- A single explicit statement in the index resolving whether Epic 1 palette persistence is `localStorage` or SQLite.
- An end-to-end contract for how the renderer discovers the server base URL when `PANEL_PORT` differs from `7077`.
- A direct work-breakdown link showing whether Playwright screenshot capture is in-scope for Story 5 or deferred after Epic 1.
- A documented deviation note for the `client/server` to `renderer/main` rename, if that rename is intentional.

## Spec Alignment Gaps

- The tech design does not fully honor the epic's standalone dev-mode command contract because it replaces `client` with `renderer` and does not cleanly carry the server-side equivalent through.
- The design set introduces a stronger UI verification commitment than the rest of the plan actually executes.
- The design set makes conflicting claims about what state is persisted in Epic 1 and where.

## Recommendations

1. Resolve palette persistence first. It is the highest-impact contradiction and affects schema, renderer implementation, tests, and the UI companion.
2. Resolve the `PANEL_PORT` story next. Either make it real across the boundary or remove/defer it.
3. Decide whether Playwright screenshot capture is truly part of Epic 1. If yes, wire it into Story 5, `test-plan.md`, and verification scripts. If no, mark it deferred consistently.
4. Normalize naming across epic and tech design for package boundaries and standalone dev commands, or record the rename as an intentional deviation in the index.

## Outcome After Fixes

Once those cross-document seams are cleaned up, this should be in strong shape for handoff. The structure is already correct for `ls-tech-design-v2`; what it needs now is internal consistency so the index, companions, test plan, and UI spec all describe the same system.
