# Finding 003 — v2-specific observations so far

**Date:** 2026-04-17
**v2-specific:** Yes — this file is exclusively about what the v2 experiment adds over v1.
**Severity:** Informational (establishes baseline; no issues yet).
**Status:** Most v2-specific surface area NOT YET EXERCISED; initial indirect observations positive.

## Summary

The v2 pilot's experimental delta over v1 centers on the UI spec companion and the associated orchestration changes. None of that surface area has been exercised yet — Story 0 has no UI, so the UI spec is skipped per v2's conditional scope logic. What we CAN say is (1) the conditional skip worked cleanly, (2) the UI spec artifact as a consumed-by-reference object is cleanly isolated, and (3) the ownership contract between tech design and UI spec appears to hold from a read-only inspection. Real validation of v2's UI-spec mechanics is pending Stories 5-8.

## What v2 actually adds over v1 (scope recap)

From `ls-team-impl-v2` intro:

> It mirrors the stable `ls-team-impl` body and adds conditional handling for an optional `ui-spec.md` companion produced by the v2 tech design.

Concretely:

| Area | v1 behavior | v2 delta |
|------|-------------|----------|
| Tech design output | `tech-design.md` (single file) or split companions | Same + optional `ui-spec.md` when UI Companion Invocation Rubric fires |
| Story-level artifact reading | Story + epic + tech design + test plan | Same + UI spec when in scope for the story |
| Handoff template | Implementer/reviewer templates without UI-spec handling | Same + conditional UI-spec reading instructions |
| Story acceptance | Code + test + gate check | Same + (when UI spec in scope) structural UI compliance check + screenshot artifacts produced + human visual review |
| Verification ceiling | Agents verify what they can verify | Explicitly: agents do structural UI checks only; visual quality is a human gate |
| Epic acceptance | Four-reviewer parallel review | Same + (when UI spec present) screenshots surfaced for human visual review |

## What we observed so far (Story 0 context)

Story 0 delivers the monorepo + tooling foundation and has zero UI scope. The UI spec coverage map (in `docs/epic-1-app-shell/stories/coverage.md` and in this project's team-impl-log) confirms:

- Stories 0–4 + 9: UI spec NOT in scope.
- Stories 5–8: UI spec in scope.

For Story 0 the team-impl-v2 skill correctly identifies UI spec as out-of-scope and skips the relevant reading and verification steps. The implementer template in our materialized log correctly annotates "UI spec is NOT in scope for Story 0; skip it." No surprises, no leakage of UI-spec requirements into a non-UI story.

## UI spec as a consumed artifact (read-only inspection)

While I have not stress-tested v2's runtime behavior around the UI spec, I have read `docs/epic-1-app-shell/ui-spec.md` indirectly (via tech-design references and during artifact inventory). Initial observations:

### Strengths

- **Separation is clean.** The UI spec lives adjacent to but separate from the tech design companions; no duplication of interfaces or data contracts.
- **One-way ownership appears to hold.** The UI spec references tech-design identifiers (e.g., references to `SignInButton`, `<ErrorEnvelopeCard>`, palette tokens) without redefining them. The v2 skill's compliance warning — "If the UI spec is redefining an interface instead of referencing it, flag it" — seems well-placed; we haven't seen a violation but we also haven't seen the UI spec get exercised against actual code.
- **Verification surface is explicit.** The spec designates Playwright screenshots as the project's chosen verification surface. This gives automated agents a concrete artifact to produce (17 baseline screenshots, per the spec).

### Untested surface (big list — these are all v2-specific validation gaps)

- Whether the implementer template's UI-spec reading instruction produces useful reflections at the teammate layer.
- Whether Codex honors the UI spec's component contracts and state presentations in generated code.
- Whether the "structural UI compliance" check (named components present, named states reachable) is actually enforceable from a CLI review.
- Whether the one-way ownership contract holds bidirectionally — i.e., whether Codex tries to redefine interfaces in renderer code that should reference tech-design identifiers.
- Whether the Playwright screenshot capture workflow (17 baseline images) runs cleanly end-to-end on Windows, given our Codex-sandbox history.
- Whether "human visual review" as a gate actually slots into the Claude Code orchestration model — we have not yet tested the mechanism by which screenshots get surfaced to the user.

## Risks specific to v2 (predicted, not yet observed)

1. **Screenshot capture failure on Windows.** Playwright on Windows under a restricted Codex sandbox may have its own class of sandbox failures. Given the sandbox issues surfaced in Finding 001, there's reason to suspect Story 5 (which activates Playwright) will surface new failure modes.

2. **UI spec → tech design drift.** The one-way ownership contract depends on Codex actually respecting identifier boundaries. If Codex treats the UI spec as another source of truth at equal altitude to the tech design, we get double-sourced types and subtle bugs.

3. **Verification ceiling ambiguity.** The skill's "agents verify structural compliance, humans verify visual quality" rule is crisp on paper but operationally fuzzy. We don't yet have a clean test case for what counts as "structural" vs "visual" — e.g., does color-contrast violate structural compliance or only visual quality? Story 5's first screenshot review will be the meaningful test.

## Recommended v2 skill changes (so far)

**None yet, pending real exercise of the UI spec pathway in Stories 5-8.**

The early-stage observations are all positive: the conditional skip works, the artifact separation is clean, the verification-ceiling language is precise. Refinement recommendations must wait until we've hit the first UI story.

## What to update when Stories 5-8 run

This file becomes the evidence base. Append sections as each UI-scoped story reveals something:

- How many screenshots actually got produced on first try?
- How did the ownership-contract check fire? Did we need to route the reviewer back to Codex for interface-redefinition fixes?
- Did the human visual-review gate function? How was it surfaced?
- Did Playwright on Windows introduce new sandbox-class failures?
- Did agents misattribute visual issues as structural issues (or vice versa)?

## Artifacts

- Epic 1 UI spec (produced by `ls-tech-design-v2`): `docs/epic-1-app-shell/ui-spec.md`.
- Per-story UI spec scope map: `team-impl-log.md` §UI Spec Scope.
- UI-spec-adjacent story references: Story 5 (`stories/05-react-renderer-landing-view.md`) owns the 17-screenshot baseline.
