# Epic 1 Stories Review

Reviewed directory: [C:\github\streaming-control-panel\docs\epic-1-app-shell\stories](C:\github\streaming-control-panel\docs\epic-1-app-shell\stories)

Review lens: published-story fidelity to the Epic 1 source set and `ls-publish-epic` conventions, with alignment checks against [C:\github\streaming-control-panel\docs\epic-1-app-shell\epic.md](C:\github\streaming-control-panel\docs\epic-1-app-shell\epic.md), [C:\github\streaming-control-panel\docs\epic-1-app-shell\tech-design-server.md](C:\github\streaming-control-panel\docs\epic-1-app-shell\tech-design-server.md), [C:\github\streaming-control-panel\docs\epic-1-app-shell\tech-design-client.md](C:\github\streaming-control-panel\docs\epic-1-app-shell\tech-design-client.md), [C:\github\streaming-control-panel\docs\epic-1-app-shell\ui-spec.md](C:\github\streaming-control-panel\docs\epic-1-app-shell\ui-spec.md), and [C:\github\streaming-control-panel\docs\epic-1-app-shell\test-plan.md](C:\github\streaming-control-panel\docs\epic-1-app-shell\test-plan.md).

## Overall Assessment

`MOSTLY READY`, with 1 high-severity issue and 2 medium-severity issues that should be fixed before relying on this story set as the implementation handoff artifact.

The story set is structurally strong. The files are present, consistently named, include the expected Jira markers, and the coverage artifact exists. Most of the problems are not missing sections; they are places where the published stories either drift from the source contract or create conflicting guidance across stories.

## Strengths

- The story set follows the expected `00` through `09` numbering and includes `coverage.md`.
- Every story includes the expected Summary, Description, Acceptance Criteria, Technical Design, and Definition of Done sections.
- The story set does a good job carrying forward cross-story sequencing, especially around split ACs such as AC-3.4, AC-6.3, and AC-8.1.
- The coverage artifact is useful and readable, and the integration-path framing is strong.

## Findings

1. **[P1] Registering the privileged app scheme after ready breaks the Electron contract.**

   References: `stories/07-electron-main-full-app-mode.md:18`, `stories/07-electron-main-full-app-mode.md:89-99`; `tech-design-server.md:195-211`

   Story 7 says `startElectron()` awaits `app.whenReady()` and then registers the `app://` scheme as privileged. That is not the Electron contract. `protocol.registerSchemesAsPrivileged(...)` must happen before the app is ready; only `protocol.handle(...)` belongs after readiness. The underlying tech design gets this right, but the story text does not.

   Why this matters: if an implementer follows the story literally, the packaged renderer may not get the expected `standard`, `secure`, and `supportFetchAPI` behavior. That puts Story 4's `app://panel` Origin trust-boundary assumptions at risk.

   Recommended fix: rewrite Story 7 so the scheme registration and the handler registration are two separate steps. The story should say the privileged scheme is registered before `app.whenReady()`, and the `protocol.handle('app', ...)` wiring happens after readiness.

2. **[P2] TC-9.1b is rewritten instead of preserved from the epic.**

   References: `stories/03-data-layer-bootstrap.md:40-44`, `stories/03-data-layer-bootstrap.md:99`; `epic.md:490-493`; `tech-design-server.md:969-1009`

   The story changes TC-9.1b from the epic's wording about writing a sentinel row into a test-only table to a different Given/When/Then using `PRAGMA user_version`. The story does explain the deviation, and the tech design clearly supports the `PRAGMA user_version` approach, but the published story still rewrites the TC rather than carrying it forward verbatim.

   Why this matters: `ls-publish-epic` treats the detailed epic as the source of truth and expects TCs to be preserved exactly, with refinements added as notes. Rewriting the TC inside the published story set weakens traceability and makes coverage review less trustworthy.

   Recommended fix: restore the original TC wording in the Acceptance Criteria and move the `PRAGMA user_version` substitution into a technical-design note. If the team wants the TC itself changed, update the source epic first and then republish the stories.

3. **[P2] Story 2 and Story 4 disagree on which tests are already live.**

   References: `stories/02-stub-endpoints.md:96-100`, `stories/02-stub-endpoints.md:112`; `stories/04-server-gate-origin-session.md:167-183`; `test-plan.md:223-232`, `test-plan.md:460-462`

   Story 2 says several route tests are already live through the Story 1 stubs, including some `/live/events` 401-path tests and parts of the `/oauth/callback` surface. Story 4 later says previously skipped tests flip live there, and the exact set does not fully line up. The source test plan also contains nuance here: some 401-path tests are live earlier, while valid-session and Origin-dependent cases need Story 4.

   Why this matters: the disagreement leaves implementers unclear about which story is supposed to make specific tests pass, and it makes the Definition of Done harder to trust for both stories.

   Recommended fix: normalize the status of each disputed TC across Story 2, Story 4, and the surrounding test-inventory notes. A good cleanup would be:
   - mark GET `/oauth/callback` checks as live in Story 2,
   - mark Origin-dependent `/auth/login` cases as Story 4,
   - mark valid-session-dependent `/live/events` cases as authored in Story 2 and un-skipped in Story 4,
   - make both stories' DoD/test-count notes reflect the same split.

4. **[P3] TC-5.3a's structural check is broader than the actual CI requirement.**

   References: `stories/09-ci-workflow.md:67-71`, `stories/09-ci-workflow.md:116`; `epic.md:322-325`; `test-plan.md:574`

   Story 9 defines the packaging-absence check as a banned-substring scan over workflow `run:` values, including `build`, `package`, and `release`. That is stricter than the underlying requirement, which is only that CI not package installers, not publish releases, and not run on a cross-OS matrix.

   Why this matters: banning generic substrings like `build` is brittle and will create false positives if the workflow later contains harmless commands or script names that happen to include that word.

   Recommended fix: narrow the test to explicit packaging and release signals such as `electron-builder`, `pnpm package`, and known release-publish actions, while keeping the separate assertion that `runs-on` is a single Ubuntu runner and that no release actions are present.

## Recommended Next Pass

1. Fix Story 7's Electron protocol ordering so the story matches the actual Electron lifecycle contract.
2. Repair Story 3's TC-9.1b carry-through so the published story set preserves the epic's acceptance text.
3. Reconcile Story 2 and Story 4 test-status language against the test plan so each TC has one clear story owner and one clear live/un-skip status.
4. Narrow Story 9's structural CI assertions to explicit packaging and release behavior.

## Outcome After Fixes

This is close. The story set already has the right overall shape and is much stronger structurally than a typical first publish. Once the contract drift and cross-story contradictions above are cleaned up, it should be a solid implementation handoff artifact.
