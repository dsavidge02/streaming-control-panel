# Liminal Spec v2 Findings

Working notes for refining the experimental v2 Liminal Spec skills: `ls-tech-design-v2` (produced Epic 1's UI spec) and `ls-team-impl-v2` (currently driving Epic 1 implementation).

**Purpose:** accumulate real-world feedback from running v2 end-to-end on the streaming-control-panel project. Findings here feed back into the skill authors' refinement process. Distinguishes v2-specific issues from issues common to v1 (both for accurate attribution and to surface cross-skill-family improvements).

> **Canonical runbook for running Codex:** [`docs/codex-harness.md`](../codex-harness.md) + the scripts at `scripts/codex/`. That doc + those scripts are what future teammates use; findings below are the historical evidence that shaped them.
>
> Finding 007's original "use this pattern" claim held for Story 0 but not Story 1. The runbook supersedes findings 007 and 006 and incorporates findings 001, 004, 005, 009.

**Status as of 2026-04-17:** Epic 1 in-progress. Story 0 and Story 1 accepted + committed. UI spec surface area of v2 has **not yet been exercised** — the UI spec enters scope at Story 5.

**For anyone implementing Story 2+: read `docs/codex-harness.md` first.** The findings below explain *why* the runbook looks the way it does.

---

## Findings Index

| # | Date | File | v2-specific? | Status |
|---|------|------|--------------|--------|
| 001 | 2026-04-17 | [`001-windows-codex-sandbox.md`](001-windows-codex-sandbox.md) | No — skill-family issue | Mitigated locally; upstream fix report at `docs/research/ls-team-impl-windows-codex-findings.md` |
| 002 | 2026-04-17 | [`002-orchestration-patterns.md`](002-orchestration-patterns.md) | No — orchestration pattern | Captured as global memories; suggest codifying in skill body |
| 003 | 2026-04-17 | [`003-v2-specific-observations.md`](003-v2-specific-observations.md) | Yes — what's unique about v2 | Most untested; initial observations positive |
| 004 | 2026-04-17 | [`004-tmp-path-divergence-write-vs-bash.md`](004-tmp-path-divergence-write-vs-bash.md) | No — skill-family issue on Windows | Worked around via absolute Windows paths; skill-body docs change + delivery-assertion rule recommended |
| 005 | 2026-04-17 | [`005-codex-workdir-must-exist-before-command.md`](005-codex-workdir-must-exist-before-command.md) | No — `codex-subagent` edge case | Worked around by pre-creating target dir from caller bash; skill-body docs change recommended |
| 006 | 2026-04-17 | [`006-codex-launch-flake-retry-wrapper.md`](006-codex-launch-flake-retry-wrapper.md) | No — skill-family issue on Windows | Mitigated via shell-side auto-retry wrapper; initial wrapper had 2 bugs (wrong JSONL field name + too-narrow flake detection) — fixes documented inline. Final pattern in finding 007 |
| 007 | 2026-04-17 | [`007-working-pattern-for-windows-codex-runs.md`](007-working-pattern-for-windows-codex-runs.md) | No — positive finding | **Proven end-to-end** — Story 0 landed green using this compound pattern (9-rule prompt preamble + absolute Windows paths + auto-retry wrapper + independent completion checker). **Start here for Story 1+.** |
| 008 | 2026-04-17 | [`008-standalone-subagent-trap.md`](008-standalone-subagent-trap.md) | No — orchestration pattern | Captured in project memory (`feedback_always_spawn_as_teammate.md`); suggest two-sentence skill-body rewording. Companion to Finding 002 — 002 covers delivery-to-mailbox trap, 008 covers spawn-mechanism trap. |
| 009 | 2026-04-17 | [`009-session-wide-codex-flake-walls.md`](009-session-wide-codex-flake-walls.md) | No — Windows Codex platform behavior | Refines finding 006 and updates finding 007's residual-gotcha language. Story 1 evidence shows a distinct **session-wide wall** mode of `-1073741502` (not the per-command flake). Mitigation: wrapper cap bumped 2 → 3; wall-detection short-circuit added to env-rules. |
| 010 | 2026-04-17 | [`010-playwright-fullpage-default.md`](010-playwright-fullpage-default.md) | **Yes — v2 skill gap** | Story 5 human visual review caught: Playwright baselines default to viewport-only, silently clipping below-fold content (the footer). Structural review cannot catch this. Recommend both `ls-tech-design-v2` and `ls-team-impl-v2` codify `fullPage: true` as the default capture mode for UI-spec-scoped screenshot verification. |
| 011 | 2026-04-18 | [`011-tech-design-preload-slot-invalid-electron-vite.md`](011-tech-design-preload-slot-invalid-electron-vite.md) | Partial — tech-design-family (v1+v2) | Story 7 observed-run caught: tech-design §Packaging prescribed an empty `preload` slot for electron-vite 5, which rejects any configured section without an entry. Dual review passed (faithful to spec); `pnpm start` failed. Validates "observed-run gate catches defects structural review cannot" alongside Finding 010. Recommend tech-design skills prescribe either a stub preload entry file or omit the slot entirely. |
| 012 | 2026-04-18 | [`012-codex-harness-background-shell-path-gap.md`](012-codex-harness-background-shell-path-gap.md) | No — harness / Windows-env issue | Story 7 fix round: wrapper exit 127 + empty JSONL on first attempt, succeeded on retry. **Original PATH-gap diagnosis was wrong** — `C:\Users\dsavi\AppData\Roaming\npm` is present in Windows user-level PATH and correctly inherited by both foreground and background Bash-tool subshells; `codex` resolves. Exit 127 was transient (likely stale process or startup race). Teammate-silence-on-failure observation stands; harness-side PATH guard still reasonable as defense-in-depth. See in-file "Update 2026-04-18" block for corrected diagnosis. |

## How to add findings

One file per finding. Use a short kebab-case descriptor prefixed by sequence number (001, 002, …). Each file:

- Summary (2-3 sentences)
- v2-specific attribution (or note that it applies to v1 too)
- What happened (narrative)
- Impact on the run
- Recommended skill change (if any)
- Artifacts / links

Keep entries dated. If a finding is later resolved, append a resolution line rather than deleting.

## Scope of the v2 experiment (from the skill body)

From `ls-team-impl-v2` introduction:

> This is `ls-team-impl-v2`, paired with `ls-tech-design-v2`. It mirrors the stable `ls-team-impl` body and adds conditional handling for an optional `ui-spec.md` companion produced by the v2 tech design.

**What v2 actually adds over v1** (for attribution purposes):

1. **UI spec companion is a new artifact type** produced by `ls-tech-design-v2` when the UI Companion Invocation Rubric fires. For Epic 1 it fired, producing `docs/epic-1-app-shell/ui-spec.md`.
2. **Conditional handling in ls-team-impl-v2:** the implementer and reviewer templates include UI-spec reading steps *when the spec is in scope for the current story*; they skip it when not.
3. **"One-way ownership contract":** the UI spec references tech-design identifiers but does not redefine them. v2 adds a compliance check that the contract holds.
4. **Verification ceiling note:** agents verify *structural* UI compliance (components present, states reachable, screenshots produced); visual polish remains a human gate.
5. **Human visual-review gate** before story/epic acceptance when UI spec is in scope.

**What is NOT v2-specific** (same as v1):
- Codex CLI driving, team creation, story cycle, verification gates, boundary inventory, memory/feedback mechanics, idle-notification semantics, Windows platform integration.

When reading findings below, this distinction matters: (1) and (2) are the sole sources of v2-specific risk; everything else is a shared issue that would surface equally in v1.
