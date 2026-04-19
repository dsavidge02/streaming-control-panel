# Finding 010 — v2 skill gap: Playwright baselines must default to `fullPage: true`

**Date:** 2026-04-17
**v2-specific:** Yes — concerns the UI-spec verification surface produced by `ls-tech-design-v2` and consumed by `ls-team-impl-v2`.
**Severity:** Major (caused real defect to ship through structural review; caught only by human visual review).
**Status:** Worked around in-cycle during Story 5 fix round 2. Recommend both v2 skills codify `fullPage: true` as the default capture mode.

## Summary

When `ls-tech-design-v2` produces a UI spec whose verification surface is Playwright screenshots, neither that skill nor `ls-team-impl-v2` currently specifies the capture mode. Playwright's default is viewport-only capture. For any landing or long-scroll page whose content exceeds the configured viewport height, the default mode silently truncates the baseline — the visible portion looks fine, and the clipped content (commonly the footer or trailing sections) is invisible to structural review. Agent-level structural compliance checks still pass because the clipped component exists in code and the screenshot exists on disk. Only human visual review catches the truncation, and only if the reviewer happens to ask "where's the rest of the page?" rather than just confirming each named state rendered.

The fix is a one-line change per call site: `{ fullPage: true }` on every `toHaveScreenshot` / `screenshot` invocation. Both v2 skills should state this as the default, with an explicit opt-out for cases where viewport-only is the intent (e.g., verifying above-the-fold composition specifically).

## What happened (Story 5 narrative)

Story 5 implemented the 17 Playwright baselines per the UI spec's verification-surface state matrix. The harness accepted them: 17 PNGs present at the expected paths, named correctly, valid PNG magic bytes, non-placeholder. Structural review (Codex spec-compliance + Opus architectural pass) passed. The implementer's `fullPage` usage was not configured — Playwright fell through to its viewport-only default at the configured 1280×800.

The landing view's content height exceeds 800px at 1280 width. The footer (`<Footer />` per ui-spec §7, rendering `© HIGH SCORE · STREAMING CONTROL PANEL ... HI: 9999999 · EPIC 1 / 6`) sat below the fold across all 16 non-responsive baselines. The implementation was correct: `<Footer />` was present, rendered, composed in the right position in `<Landing>`. It simply wasn't captured.

Structural review missed it because structural review verified "does `<Footer />` exist as a module? yes" — which it did. The compositional question "is `<Footer />` visible in the screenshot?" was never asked because the screenshot existed.

Human visual review caught it in the first pass: *"The bottom seems to be cut off, is there a scroll bar hidden maybe?"* Orchestrator verified by reading the affected PNG; routed fix round 2; reviewer updated `landing.spec.ts` to pass `{ animations: "disabled", fullPage: true }` on every `toHaveScreenshot` call (9 occurrences) and regenerated all 17 baselines. Post-fix: default-viewport PNGs grew from 1280×800 to 1280×903 (content depth); responsive 960-width PNG became 960×1231 (reflowed content); footer now visible on every baseline.

Cost of the miss: one extra fix-driver round (2 Codex iterations, ~15 minutes of wall-clock), regeneration of all 17 baselines, one ui-spec update (which also covered the companion Defect A — palette switcher collapsed state, separately tracked).

## Why this is a v2 skill gap, not an implementer mistake

The spec was silent on capture mode. The implementer's Playwright config + spec calls defaulted to Playwright's native default. No automated check would ever have flagged this — `playwright test` passes identically whether you're clipping content or not, as long as the snapshot matches itself.

The verification-surface section of `ls-tech-design-v2`'s UI spec template (ui-spec §Verification Surface in our Epic 1 case) names Playwright as the capture tool and the state matrix as the capture matrix. It does not name the capture mode. A spec consumer (implementer or CLI subagent) has no signal that full-page is expected.

For `ls-team-impl-v2`, the implementer template includes UI-spec reading steps and the verification surface section is part of that read. The template could enforce a floor — "when the verification surface is Playwright screenshot capture, every capture call uses `fullPage: true` unless the spec explicitly names a viewport-only state" — and that single line would prevent the class of defect entirely.

The cost of viewport-only-by-default is high: the skill's own claim that "structural compliance is verified by agents; visual quality remains a human gate" relies on the human seeing the *actual* UI. If the baseline is silently clipped, the human sees an abbreviated UI and the verification ceiling shifts down. The gap narrows what human review can catch, but the skill body presents visual review as a load-bearing gate.

## Recommended skill change

**In `ls-tech-design-v2` (UI spec template generator):**

Add to the Verification Surface template scaffold: *"Playwright screenshots capture the full page (`fullPage: true`) by default. Viewport-only captures must be named explicitly as 'above-the-fold' or 'header-only' in the state matrix and annotated with the capture mode."*

This places the default at the spec-authoring layer, which propagates to every state matrix produced by v2 tech design sessions.

**In `ls-team-impl-v2` (implementer + reviewer templates):**

Add to the UI-scope implementer template's Step 3 (task authoring): when writing the Codex task section, if the verification surface is Playwright and the spec does not specify a per-state capture mode, the task section must include *"Every `toHaveScreenshot` / `page.screenshot` call in `*.spec.ts` passes `{ fullPage: true, animations: 'disabled' }` as the option object."*

Add to the reviewer template's Step 3 (Codex review criteria): *"Verify every screenshot call in test files passes `fullPage: true` (or the spec explicitly marked that state as viewport-only). A viewport-default capture on a full-landing baseline is a Major finding."*

Both inserts are cheap — roughly one line each in the skill body. They close a verification-ceiling leak.

## Also worth noting

The adjacent gap: the UI spec's state matrix enumerates *states*, not *capture dimensions*. For a responsive state like `landing.default at 960×600 (responsive min)`, the implementer has to infer whether the baseline should be (a) exactly 960×600 clipped to the minimum viewport, or (b) 960-wide fullPage showing reflow. Both are defensible reads of the spec. Story 5 landed on (b) — the 960×1231 baseline — which is the more useful signal for visual review (all content visible at narrow width) but isn't what the spec phrasing most-literally implies.

Suggest both v2 skills adopt the convention: **responsive state baselines capture full page at the specified width, not clipped at the specified height**. The height in `(960×600)` communicates the minimum viewport target, not the capture rectangle. The skill body should make that explicit.

## Artifacts / links

- Story 5 team-impl-log section: `docs/epic-1-app-shell/team-impl-log.md` §Story 5 Pre-Acceptance Receipt (to be appended after commit)
- Fix round 2 driver reports: `C:/Users/dsavi/AppData/Local/Temp/codex-story-5-fix-round-2.impl-report.md` + iter-{1,2} JSONLs
- Before/after baseline dimension evidence:
  - Before fix: `landing-default-amber.png` 1280×800, `landing-default-amber-responsive-960x600.png` 960×600 (both viewport-clipped)
  - After fix: `landing-default-amber.png` 1280×903 (+103px to footer), `landing-default-amber-responsive-960x600.png` 960×1231 (+631px reflowed content)
- Current ui-spec §Verification Surface: `docs/epic-1-app-shell/ui-spec.md` — does not specify capture mode
- Current ui-spec §6 responsive variant table: ambiguous between viewport-clipped and width-constrained interpretation
- Fix implementation: every `toHaveScreenshot` call in `apps/panel/client/tests/e2e/landing.spec.ts` now passes `{ animations: "disabled", fullPage: true }`

## Companion finding

Defect A from the same human-visual-review pass (palette switcher had no collapsed state) is a different class — spec ambiguity between §6 state matrix naming a `palette-switcher-open` state and §7 component block describing only the open state. That's documented separately in ui-spec §8 UA5 as accepted + resolved. It's a spec-authoring gap, not a skill-mechanics gap. If it recurs on Story 6 or a future epic's UI spec, promote it to its own finding.
