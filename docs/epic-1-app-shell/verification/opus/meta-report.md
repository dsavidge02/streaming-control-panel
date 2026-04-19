# Epic 1 — Meta-Report (Opus)

Meta-analysis of the three Epic 1 verification reports that landed:
- Opus (mine) — `docs/epic-1-app-shell/verification/opus/epic-review.md`
- Sonnet — `docs/epic-1-app-shell/verification/sonnet/epic-review.md`
- gpt-5.4 (salvaged) — `docs/epic-1-app-shell/verification/gpt54/epic-review.md`

gpt-5.3-codex was skipped per skill fallback (Windows PowerShell tool-runtime
incompatibility for that model).

---

## Ranking (best → worst)

1. **Sonnet** — tightest. Covers everything Opus covers, structured more
   efficiently, and the M1 heartbeat analysis is more rigorous than mine
   (Sonnet reasoned through Fastify's `inject()` buffering behavior and why the
   test resolves at all, not just why the assertion is weak). Fewer words,
   similar signal. 3 Major + 8 Minor is calibrated for real ship decisions
   without the long-tail noise my report piled on.
2. **Opus (mine)** — broader coverage surface (UI spec compliance, boundary
   inventory, baseline-image integrity, cross-report AC matrix) but bloated.
   13 Minors is too many; the "What else did I notice" section has 12 items,
   several of which are pure speculation (m11, m12). The AC coverage matrix
   is more thorough than Sonnet's and is the single biggest thing the meta
   should keep from my report. I wrote this, and I'm calling it second-best
   honestly — Sonnet did the main job cleaner.
3. **gpt-5.4 (salvaged)** — partial by necessity, not by author choice. Of
   the five surviving bullets, four are corroborated by Opus/Sonnet and one
   is genuinely novel (S1: `.gitattributes` / `core.autocrlf` ↔ Biome).
   The salvage doc itself is excellent — transparent provenance, clear scope
   of what was lost, honest "do not fabricate a grade" stance. As a review
   output it's thin; as a forensic artifact it's well-authored.

---

## Per-report assessment

### Opus (mine — ranked 2)

**What's good:**
- Full AC coverage matrix (38 ACs mapped to primary surface + verification).
  Neither of the other reports did this at file-level granularity.
- Boundary inventory audit explicitly checked the team-impl-log's claimed
  status against grep'able reality; none of the others did this.
- UI spec compliance has its own section covering component naming, state
  coverage, baseline image set integrity, and cross-story visual consistency.
- `smoke:packaged` audit: walked through what it actually proves (Electron
  main spawn, Fastify bind, migrations, Origin allowlist, central error
  handler, asarUnpack, native binding survival) — the best single packaging
  section across the three reports.
- Ship-readiness reasoning is explicit about why B+ (not A).

**What's not good:**
- **Too long.** ~550 lines for an epic-level review; Sonnet did the same job
  in ~450 lines denser. "What else did I notice but not fully investigate"
  grew to 12 items, several speculative (m11 redacting config, m12 timer
  race, m8 `prefers-reduced-motion`) rather than grounded defects.
- **M1 analysis is shallower than Sonnet's.** I flagged the cadence test as
  not exercising the interval, but Sonnet actually traced through Fastify's
  `inject()` buffering semantics to explain why the test resolves without
  `reply.raw.end()`. My analysis would be correct if an implementer asked
  "is this broken?", but Sonnet's would actually enable a fix.
- **M3 bundles three drifts.** PATHS shape + dead asarUnpack + stale
  test-e2e-placeholder are three separate things; I grouped them as "M3
  plus M3b" which is weaker severity signaling than three clean findings.
- **Minor m13 (test-plan reconciliation off by one)** is trivia; should be
  dropped or folded into a single "test-plan refresh" item.
- **Missed the `.gitattributes` / CRLF issue** entirely.

### Sonnet (ranked 1)

**What's good:**
- **Best M1 analysis** — Sonnet actually reasoned about whether the test
  can even resolve given Fastify's `inject()` semantics, traced that the
  initial unconditional heartbeat satisfies the assertion, and proposed
  a concrete fix (assert ≥2 heartbeats after advancing 30s, or test
  interval-specific timing at 14s vs 16s).
- Test-quality section cleanly separates "strong tests" and "weak or
  tautological tests" with reasoning for each — more useful to read than my
  narrative paragraphs.
- Spotted m1 (`envelope.ts` consolidated into `codes.ts` — spec file tree
  outdated) that I missed.
- Calling the three-near-identical `liveEvents.test.ts` tests (m2) as
  "spec-directed duplication" is the right framing: accept as-is because
  the test plan maps each TC to a separate test, but flag for Epic 2's
  test-plan evolution.
- The packaging review (§Electron + packaging) touches everything my report
  does but more compactly.
- m5 (`rebuild:electron` runs on every `pnpm start`, slow DX) is a practical
  insight I missed.

**What's not good:**
- **No AC/TC coverage matrix at file-level** — Sonnet's table just lists
  "Landing view AC-1.1–1.4 → Covered". The per-AC ownership trace I did is
  the one thing my report has over Sonnet's.
- **No explicit UI-spec compliance section** — component naming, state
  coverage, baseline image integrity all condensed to a few paragraphs.
  My report has more depth here.
- **No boundary inventory audit.** Sonnet implicitly trusts the
  team-impl-log; I explicitly checked.
- **Grade: B.** Mine was B+. Our disagreement is mild and defensible on
  both sides (see §Severity calibration).
- **m6 (missing `Hero` component reference)** is a false positive — Sonnet
  noticed the tech-design imports `<Hero>`, checked the implementation, saw
  `Hero.tsx` exists, and concluded "no issue." The minor should have been
  dropped rather than kept as "no issue found."

### gpt-5.4 (salvaged — ranked 3)

**What's good:**
- **S1 (`.gitattributes` / `core.autocrlf` ↔ Biome)** is the single finding
  no other reviewer caught. I verified: `.gitattributes` contains only
  `* text=auto` (no `eol=lf`), and `biome.json` does not specify
  `formatter.lineEnding`. On Windows with `core.autocrlf=true`, this
  combination can cause Biome to flag every file as formatting-dirty. This
  is a real, mechanically-verifiable drift worth a clean follow-up.
- The salvage doc itself is unusually rigorous — session provenance (thread
  ID, token usage, wall time, failure modes), verbatim agent-message
  transcript, explicit scope of what was lost, and a "do not fabricate a
  grade" recommendation to orchestration. When a tool runtime fails mid-
  session, this is the right way to surface what survived.
- **Confidence labels per finding** (High/Medium) are good meta-analysis
  hygiene — none of the other reports self-graded their findings.
- S3 (Windows-only packaging scripts vs README claims portability) is a
  legitimate gap I glossed over; my report's Minor m7 (`SMOKE_MODE=1` env
  var unused) is adjacent but less pointed.

**What's not good:**
- **Partial by necessity.** Five bullets, no Minors, no AC/TC matrix, no
  grade. Not gpt-5.4's fault (Windows tool wall), but also not a full
  review.
- **Known constraint: session wall ate the report.** 300-700 lines of
  reasoning were produced, 15 lines survived. `docs/v2-findings/009` covers
  this class of failure; the orchestration recommendation ("do not retry
  Codex on this machine until tool-runtime clears") is the right call.
- **S3 is medium-confidence only** — the salvage can't cite which README
  or tech-design lines claim host-OS packaging. I'd want that confirmed
  before acting on it.
- **No architectural alignment section.** Codex in narrative event 3 said
  it would trace this, but the trace didn't make it to the final message.

---

## Synthesis guidance

If synthesizing a single best review from these three:

**From Opus (mine), take:**
- The full per-AC coverage matrix (§Coverage verification in my report).
- The boundary inventory audit (§Boundary inventory audit in my report —
  the team-impl-log-vs-code check).
- The UI spec compliance section (component naming + state coverage +
  baseline image integrity).
- The `smoke:packaged` walk-through (§Boundary inventory audit — "is it
  real?" paragraph).

**From Sonnet, take:**
- M1's rigorous trace through Fastify's `inject()` buffering behavior.
- The "strong tests" / "weak tests" columnar split in §Test quality
  assessment.
- m1 (`envelope.ts` merged into `codes.ts`) as a documentation-drift item
  I missed.
- m5 (`rebuild:electron` latency on every `pnpm start`) as a DX item.
- The cleaner 3 Major / 8 Minor calibration (drop my speculative Minors).

**From gpt-5.4 salvaged, take:**
- **S1 (`.gitattributes` / `core.autocrlf` ↔ Biome) as a new Major finding
  no peer caught.** Reproduce on a clean Windows checkout before acting.
- S3 (Windows-only packaging scripts vs docs) reframed: confirm the
  specific doc lines first, then either widen the scripts or tighten the
  docs.
- The session-provenance discipline (thread ID + token usage + failure
  modes documented) as a template for future salvage cases.
- The `docs/v2-findings/009` escalation — the retry sessions walling from
  the first tool call suggests finding 009 may need a host-reboot addendum.

---

## Cross-report findings

| Finding | Opus | Sonnet | gpt-5.4 | Confidence |
|---------|:---:|:---:|:---:|---|
| TC-6.3a cadence test tautological | M1 | M1 | S2 | **Triply confirmed — high** |
| `CLAUDE.md` materially stale | M2 | — | S4 | **Doubly confirmed — high** |
| tech-design drift (PATHS, packaging snippets, file tree) | M3 | m1, m6 | S5 | **Triply confirmed — high** |
| Root `package.json` runtime deps — pnpm-symlink workaround | M4 | M2 | — | **Doubly confirmed — high** |
| Dead asarUnpack pattern (`node_modules/better-sqlite3/`) | (m in M3) | M3 | — | **Doubly confirmed — high** |
| `buildServer.test.ts` second test tautological | m1 | m4 | — | **Doubly confirmed — high** |
| NavBar PLAY/OPTIONS doesn't actually navigate | M5 | — | — | **Opus only — verify before acting** |
| `.gitattributes` / `core.autocrlf` ↔ Biome | — | — | S1 | **gpt-5.4 only — mechanically plausible, needs reproduction** |
| `envelope.ts` merged into `codes.ts` (spec file tree outdated) | — | m1 | (in S5) | **Sonnet + partial gpt-5.4 — verify once** |
| `rebuild:electron` on every `pnpm start` (slow DX) | — | m5 | — | **Sonnet only — not a ship blocker; Epic 2 cleanup** |
| three near-identical `liveEvents.test.ts` tests | — | m2 | — | **Sonnet only — spec-directed, accept** |
| Windows-only packaging scripts vs docs | (m7 adjacent) | — | S3 | **gpt-5.4 primary — needs confirmation** |
| `smoke:packaged` not wired in CI | (noted) | m8 | — | **Both call it out; accepted deferral per decisions-log** |
| `testBypass.ts` redundant `DEV` check | — | m7 | — | **Sonnet only — trivia** |
| `SignInProvider` pattern beyond tech-design | m3 | (in interface section) | — | **Opus primary — defensible refactor** |
| `prefers-reduced-motion` not implemented | m8 | — | — | **Opus only — ui-spec commitment unfulfilled** |
| `braindump.md` untracked but not gitignored | m12 | — | — | **Opus only — housekeeping** |

**High-confidence finding set** (≥2 reviewers): TC-6.3a cadence, CLAUDE.md
stale, tech-design drift, root package.json deps, dead asarUnpack, weak
buildServer test, dead asarUnpack pattern, `envelope.ts` location drift.
These should be the primary fix batch.

**Unique-to-one-reviewer set**: NavBar click (Opus), `.gitattributes`
(gpt-5.4), `rebuild:electron` DX (Sonnet), Windows-only scripts (gpt-5.4),
`prefers-reduced-motion` (Opus). Each needs quick independent verification
before acting.

---

## Severity calibration

Where the reports disagree:

### Grade letter: Opus B+, Sonnet B, gpt-5.4 none

**My call: Sonnet's B is more defensible.** My B+ rewards the breadth
(boundary inventory, UI compliance section) over the actual delivery
quality. Sonnet's weighting prioritizes the tautological-cadence-test as
proportionally more concerning for a test-driven codebase, and that's the
right emphasis. The grade disagreement is small and honest; either letter
would be defensible to the user. I'd roll back to B if synthesizing.

### M1 severity: both Major — unanimous

No disagreement. Triply confirmed.

### Root package.json deps: Opus M4, Sonnet M2

Both Major. Sonnet's framing ("needs lifecycle ownership — assign a specific
story to validate and remove") is more actionable than mine ("document
TODO"). Take Sonnet's framing.

### Dead asarUnpack: Opus bundled into M3, Sonnet standalone M3

Sonnet gave it a standalone Major; I embedded it in an M3 super-item. Sonnet's
split is cleaner for tracking purposes; split mine.

### NavBar click: Opus M5, others — not mentioned

I backed this as Major because the ui-spec explicitly commits to "navigate
+ flash" behavior. Sonnet likely saw the same code but considered the
current simulation acceptable. **Downgrade to Minor** — the AC-2.1 TCs pass
via direct URL navigation; the NavBar demo is cosmetic for Epic 1. My
Major was too aggressive.

### `.gitattributes` / CRLF: gpt-5.4 S2 Major, others — missed

gpt-5.4 flagged as Major. Without a reproduction I can't confirm the
severity, but the mechanical plausibility is high. **If reproduction on a
fresh Windows checkout shows `pnpm verify` red, this is a ship-blocker
for any new Windows contributor — promote to Critical.** If reproduction
shows green (Biome 2 may autodetect line endings), demote to Minor
config-hygiene.

---

## What the reports all missed

Re-reading all three reports cold, the set of things none of us caught:

1. **No reviewer checked whether `pnpm green-verify` is currently green on
   `main`.** The team-impl-log says it was rotated to Story 8's SHA, then
   Story 9 merged via PR #1 at `6df71f8`. `.red-ref` state after the merge
   is not described anywhere. If the red-ref is stale relative to HEAD, the
   guard is a no-op and future TDD cycles start from a broken baseline.
2. **No reviewer ran the actual test suite.** All three explicitly trusted
   the team-impl-log's "77 Vitest + 17 Playwright" claim. This is how
   review instructions read ("Trust the receipts") but it means none of us
   independently verified that the tests currently pass on the `main`
   SHA. A CI run against `6df71f8` is the only evidence; if that run
   predates some config change, we're vouching for a state that may drift.
3. **No reviewer examined `.github/workflows/ci.yml` for what happens on
   main-branch pushes.** Epic AC-5.5 says "CI does not run on main push"
   (TC-5.5b). The workflow has `on: pull_request: branches: [main]`; a
   push to main triggers no workflow. ✓ in principle. But the Story 9
   structural test (`tools/ci/workflow.test.ts`) only checks
   no-packaging + script-parity, not that `on.push` is absent. A trivial
   regression adding `on: push:` would pass CI but violate AC-5.5. We
   should flag that.
4. **No reviewer checked whether `apps/panel/client/src/index.ts` is
   actually wired up.** My report's "What else did I notice" #1 and
   Sonnet's adjacent note both flagged the file's presence without
   verifying it doesn't override the intended Vite entry. Neither of us
   opened `index.html` to check which entry script is declared.
5. **No reviewer cross-checked the five palette color values against the
   original `docs/references/neo_arcade_palettes.jsx`.** ui-spec §1
   explicitly commits to "verbatim from the reference — no softening or
   adjustment without documented rationale." A palette-by-palette hex
   diff would either confirm fidelity or surface quiet drift. This is
   cheap to do and none of us did it.
6. **No reviewer verified the `docs/v2-findings/` directory exists and
   has the entries CLAUDE.md + decisions-log reference.** If finding 009
   (session walls) was cited by gpt-5.4's salvage but the file is absent,
   that's a broken reference in the upstream-feedback chain.
7. **No reviewer checked the health of the `scripts/codex/` harness.** My
   "What else did I notice" #10 flagged its untested nature; nobody went
   further. Given Epic 2 will rely on it, a cursory correctness read would
   be prudent.
8. **No one noticed the dev-mode `/tmp/` vs Windows `%TEMP%` divergence
   in `resolveUserDataDbPath`.** My m6 vaguely gestures at it; nobody
   traces the consequence (standalone `pnpm --filter @panel/server dev`
   on Windows writes to `C:\Users\…\AppData\Local\Temp\panel-dev.sqlite`
   which pollutes the user profile indefinitely with no cleanup). Not a
   ship blocker; concrete enough to be a real Minor.

The pattern: we over-indexed on spec compliance (does the code do what the
docs say?) and under-indexed on environment/integration correctness (does
the actual running system behave well?). The salvaged gpt-5.4's S1 is the
cleanest example of what that gap produces.

---

## Bottom line for orchestration

- **Use Sonnet as the primary synthesis base.** Cleaner structure, correct
  severity calibration, rigorous on the one Major finding that matters
  most (M1 cadence).
- **Layer in Opus's coverage matrix + boundary inventory + UI compliance
  section.** Those are the one-reviewer-only surfaces.
- **Adopt gpt-5.4's S1 as a new Major** pending reproduction; adopt S3
  as a Minor pending doc-line citation.
- **Downgrade my M5 (NavBar) to Minor** — too aggressive.
- **Drop my m11/m12 speculative Minors.**
- **Add the "what all three missed" set** (§What the reports all missed
  above) as a second-pass batch before Epic 2 starts.

For ship decisions: Epic 1 is B-grade shippable. No Criticals from any
reviewer. Fix batch for the pre-Epic-2 housekeeping pass has 6-8 clean
items derived from the high-confidence cross-report set plus S1.
