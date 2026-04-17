# Epic 1 Review

Reviewed file: [C:\github\streaming-control-panel\docs\epic-1-app-shell.md](C:\github\streaming-control-panel\docs\epic-1-app-shell.md)

Review lens: `ls-epic` readiness for downstream Tech Design, with alignment checks against [C:\github\streaming-control-panel\docs\prd.md](C:\github\streaming-control-panel\docs\prd.md) and [C:\github\streaming-control-panel\docs\architecture.md](C:\github\streaming-control-panel\docs\architecture.md).

## Overall Assessment

`NOT READY` for Tech Design yet, but improved from the prior pass.

This revision fixed several of the earlier issues: the landing view now has an active sign-in action, the auth/origin checks use a concrete Epic 1 route (`POST /auth/login`) instead of a hypothetical one, the localhost redirect assumption is now correctly marked unvalidated, and the heartbeat payload contract is no longer ambiguous.

The remaining blockers are mostly about artifact boundaries rather than missing detail. The epic is still intentionally overriding the PRD’s feature boundary, and it still reads partly like a tech design by hard-coding internal structure, runtime addresses, repo layout, and source-inspection tests into acceptance criteria.

## Strengths

- The revised draft is more internally consistent than the previous version.
- The sign-in path is now much more traceable to the PRD’s first-launch behavior.
- The auth-gating and Origin-validation sections are easier to test because they now use a concrete Epic 1 route surface.
- Assumptions and contracts are tighter than before, especially around `/auth/login`, `/live/events`, and the SSE payload.

## Findings

1. **[P1] The epic still explicitly overrides the PRD by promoting developer/platform work into first-class feature scope.**

   References: `epic-1-app-shell.md:3-7`, `epic-1-app-shell.md:18`, `epic-1-app-shell.md:26`, `epic-1-app-shell.md:34-46`, `epic-1-app-shell.md:204-329`, `epic-1-app-shell.md:471-651`; `prd.md:241-266`

   The revision no longer does this accidentally; it now states the override outright in the scope note. That honesty helps, but it does not resolve the underlying problem. PRD Feature 1 keeps the feature map at product scope and explicitly says monorepo structure, shared contracts, bootstrap commands, and similar developer-facing concerns are handled outside the feature map. This epic still makes dev modes, CI policy, repo layout, package placement, and persistence bootstrap part of Epic 1’s core requirement set.

   Why this matters: a downstream Tech Lead is supposed to inherit product truth from the PRD and detailed functional truth from the epic. Right now those two artifacts still disagree on what Epic 1 is. That turns a normal epic into a hybrid of feature spec plus implementation program plan.

   Recommended fix: remove the override and align the epic back to the PRD boundary, or update the upstream PRD so this larger Epic 1 scope is formally true there as well. The current “intentional override” wording is not a substitute for artifact alignment.

2. **[P2] The epic still contains too many internal implementation commitments for an `ls-epic` artifact.**

   References: `epic-1-app-shell.md:40`, `epic-1-app-shell.md:46`, `epic-1-app-shell.md:130`, `epic-1-app-shell.md:160-165`, `epic-1-app-shell.md:182`, `epic-1-app-shell.md:290`, `epic-1-app-shell.md:318-328`, `epic-1-app-shell.md:367`, `epic-1-app-shell.md:378-419`, `epic-1-app-shell.md:448-467`, `epic-1-app-shell.md:529-583`, `epic-1-app-shell.md:640-652`

   The draft still hard-codes internal choices that belong downstream: `127.0.0.1:7077`, `.github/workflows/ci.yml`, `apps/panel/shared/`, a single central registration function, specific unit-test inspection of config objects and source comments, and direct assertions about how config is structured rather than what boundary behavior must hold. Some of these may end up being good design choices, but they are still design choices.

   Why this matters: this makes the epic more brittle than it needs to be. A Tech Lead could satisfy the intended behavior with slightly different internal seams, file locations, or wiring, but the current wording would make those design choices look like spec violations.

   Recommended fix: keep concrete external contracts, but move internal file paths, exact config shapes, source-comment requirements, workflow filenames, and port-binding specifics into Tech Design Questions or the eventual tech design. For the epic, prefer statements like “binds to loopback only,” “CI runs on pull requests,” and “shared boundary contracts are available to both client and server” unless the exact value is truly product-defining.

3. **[P2] The sign-in contract now mixes stable user behavior with temporary Epic 1 stub behavior, which makes cross-epic inheritance confusing.**

   References: `epic-1-app-shell.md:24`, `epic-1-app-shell.md:34-36`, `epic-1-app-shell.md:104`, `epic-1-app-shell.md:334-355`

   This revision correctly restored an active sign-in button, but the landing-view contract still bakes in the current stubbed `NOT_IMPLEMENTED` response and says Epic 2 will replace the server behavior “without changing” the contract. That is not quite true: the enduring contract is that the sign-in action invokes the auth entry point. The 501 result is only the temporary Epic 1 implementation state.

   Why this matters: it makes the landing-view ACs harder to inherit cleanly in Epic 2. A reader can no longer tell which part is the stable product behavior and which part is just the current milestone stub.

   Recommended fix: separate the two layers. Keep the landing AC focused on the stable contract: the button is active and invokes the auth entry point. Keep the 501 `NOT_IMPLEMENTED` behavior entirely inside the stub-endpoint section. That lets Epic 2 replace the stub behavior without making the landing AC read self-contradictorily.

## Improvements Since Prior Pass

- The sign-in button is now active instead of disabled.
- `/auth/login` gives the epic a concrete state-changing route for auth-gate and Origin-validation coverage.
- The localhost redirect assumption is correctly marked `Unvalidated`, matching the architecture doc.
- The SSE contract is clearer: `heartbeat` now has a fixed `{}` payload.

## Recommended Next Pass

1. Resolve the upstream alignment problem: either narrow the epic or update the PRD so both artifacts describe the same Epic 1.
2. Strip internal design commitments out of ACs and TCs unless they define a true external contract.
3. Split permanent sign-in behavior from temporary Epic 1 stub behavior.

## Outcome After Fixes

This is noticeably closer. The remaining issues are no longer about missing behavioral coverage; they are about keeping the epic at the right altitude and making it agree with the upstream artifact set. Once that is corrected, this should be in good shape for Tech Design handoff.
