# Epic 1 — Approved Fix List

**Source:** `verification/synthesis.md` (orchestrator synthesis) + human approval
**Target commit message stem:** `fix: pre-verification cleanup`
**Absolute paths throughout.** Working directory: `C:/github/streaming-control-panel`.

This file is the single source of truth for the pre-Epic-2 cleanup batch.
Teammates constructing handoff prompts should quote items from here by
number, not re-derive from the synthesis.

---

## Must-fix before Epic 2 starts (3 items)

### 1. CLAUDE.md §Current state rewrite

**Files:**
- `C:/github/streaming-control-panel/CLAUDE.md`
- `C:/github/streaming-control-panel/docs/epic-1-app-shell/RESTART-INSTRUCTIONS.md` (delete)

**Current state:** `CLAUDE.md:7` says "No code is implemented yet — the repo is
currently at Epic 1 Story 0 scaffolding." `CLAUDE.md:55-59` says "Story 0 and
Story 1 are accepted and committed; cumulative test count is 11 ... Epic 1's
remaining stories (2-9) are pending." Both false on `main`.

**Required change:**
- Rewrite §"Current state — before starting work" to read: Epic 1 complete.
  Stories 0–9 accepted and merged to `main` via PR #1 @ `6df71f8` (2026-04-18).
  Cumulative tests: 77 Vitest (4 shared + 2 tools/ci + 39 server + 32 client)
  + 17 Playwright baselines + 1 `pnpm smoke:packaged` boot gate. Epic 2 (Twitch
  OAuth & Tenant Onboarding) is the next epic; it has not been started.
- Update §"What this repo is" line 7 to replace the "no code is implemented"
  clause.
- Delete `docs/epic-1-app-shell/RESTART-INSTRUCTIONS.md` (already slated per
  CLAUDE.md itself).
- Remove the stale RESTART-INSTRUCTIONS.md reference on `CLAUDE.md:59`.

**Acceptance:** `grep -n "Story 0 scaffolding\|not implemented yet\|RESTART-INSTRUCTIONS" CLAUDE.md` returns nothing.

---

### 2. TC-6.3a heartbeat cadence test fix

**Files:**
- `C:/github/streaming-control-panel/apps/panel/server/src/routes/liveEvents.ts`
- `C:/github/streaming-control-panel/apps/panel/server/src/routes/liveEvents.test.ts`
- `C:/github/streaming-control-panel/apps/panel/server/src/test/buildTestServer.ts`

**Current state:** `buildTestServer` defaults `timerMode: "fake"`.
`liveEvents.ts:29-32` then emits one heartbeat and calls `reply.raw.end()` —
the `setInterval` never runs. TC-6.3a's `vi.advanceTimersByTimeAsync(30_000)`
is a no-op against the real interval; the test passes on the initial
unconditional emit alone.

**Required change:** Replace the fake-timer shortcut with a real cadence test.
Either:
- **Option A (preferred):** Remove the `timerMode === "fake"` branch from
  `liveEvents.ts`. Keep `setInterval` on every code path. In the test, use
  `vi.useFakeTimers()`, capture stream chunks via a response-chunk listener,
  advance 16s → assert exactly 2 heartbeat events (initial + one interval),
  advance another 15s → assert 3 total. Specifically verifies
  `HEARTBEAT_INTERVAL_MS = 15_000`.
- **Option B:** Keep `timerMode` but invert the branch so fake mode installs
  the interval (real mode does too) and the end-of-response is driven by the
  test manually closing the raw socket. The intent is that the test must
  observe ≥2 heartbeat emissions to pass.

Either option must make the following true: renaming
`HEARTBEAT_INTERVAL_MS = 15_000` to `HEARTBEAT_INTERVAL_MS = 31_000` causes
TC-6.3a to fail.

**Acceptance:** The cadence test asserts count ≥ 2 heartbeats after advancing
≥ 16s of fake time. Flipping the interval constant to 31_000 reproducibly
fails the test.

---

### 3. CRLF line-ending normalization (gpt-5.4 S1 REPRODUCED)

**Files:**
- `C:/github/streaming-control-panel/.gitattributes`
- `C:/github/streaming-control-panel/biome.json`
- 10 CRLF-contaminated tracked files (see list below)

**Current state:** REPRODUCED locally on 2026-04-18 by orchestrator. `pnpm red-verify` on `main` @ `6df71f8` exits 1 — `pnpm format:check` reports 10 files as formatting-dirty with `␍` (CR) characters in the diff. Root cause: `.gitattributes` contains only `* text=auto` (no `eol=lf`) + `biome.json` does not set `formatter.lineEnding`. On Windows with `core.autocrlf=true`, affected files are checked out with CRLF; Biome defaults to LF and flags them.

**CRLF-contaminated files (from `pnpm format:check` local run):**
- `apps/panel/server/package.json`
- `apps/panel/server/src/dev.ts`
- `.github/workflows/ci.yml`
- `scripts/package-and-restore-native.mjs`
- `scripts/smoke-packaged.mjs`
- `scripts/touch-better-sqlite3-binding.mjs`
- `tools/ci/package.json`
- `tools/ci/tsconfig.json`
- `tools/ci/vitest.config.ts`
- `tools/ci/workflow.test.ts`

**Required change (apply directly — no investigation needed):**

1. Replace `.gitattributes` content:
   ```
   # Enforce LF line endings across all platforms. This prevents Biome
   # format:check from flagging files on Windows hosts where core.autocrlf=true
   # converts checkouts to CRLF. Industry-standard pattern.
   * text=auto eol=lf
   ```
2. In `biome.json`, add defensive `formatter.lineEnding = "lf"`:
   ```json
   "formatter": { "enabled": true, "lineEnding": "lf" }
   ```
   (Biome already defaults to LF; explicit lock-in prevents future-Biome regressions.)
3. Run `git add --renormalize .` to rewrite git index with LF.
4. Run `pnpm format:fix` to auto-normalize file contents.
5. Verify `pnpm red-verify` exits 0 before proceeding to other items.

**Acceptance:** `pnpm format:check` exits 0. `git ls-files --eol | grep -v "^i/lf"` returns nothing (every tracked file is LF in the git index). This fix MUST land first in the sequence — every subsequent fix runs through `pnpm red-verify` as the gate.

**Severity promotion:** Reproduced locally → **Must-fix** (was "Investigate"). Without this, `pnpm red-verify` is red on `main` and every PR on Windows fails CI.

---

## Should-fix in pre-Epic-2 cleanup (9 items)

### 4. Root `package.json` runtime dependencies removal

**File:** `C:/github/streaming-control-panel/package.json`

**Current state:** `package.json:30-46` carries 11 runtime dependencies
(`@fastify/cookie`, `@fastify/merge-json-schemas`, `ajv`, `ajv-formats`,
`better-sqlite3`, `dequal`, `drizzle-orm`, `fast-json-stringify`, `fast-uri`,
`fastify`, `fastify-type-provider-zod`, `iron-session`,
`json-schema-ref-resolver`, `rfdc`, `zod`). Decision #9 in
`docs/epic-1-app-shell/stories/decisions-log.md` flags these as removable
under `node-linker=hoisted` (which is now in place per `.npmrc`).

**Required change:**
1. Create a throwaway branch `cleanup/root-runtime-deps`.
2. Delete the entire `dependencies` block from root `package.json` (keep
   `devDependencies` and `pnpm.onlyBuiltDependencies`).
3. Run `pnpm install && pnpm red-verify && pnpm verify && pnpm verify-all &&
   pnpm package && pnpm smoke:packaged`.
4. If all six green: land the cleanup. Commit message: `fix(package): remove
   Story 8 pre-hoisting runtime-dep workaround (decisions-log #9)`.
5. If any fail: restore the deps, annotate the `dependencies` block with a
   comment `// Retained: hoisting alone was insufficient on this host. See
   decisions-log.md Decision #9. Revisit in Epic 2 Story 0.`

**Acceptance:** Either deps removed and all gates green, OR deps annotated
with a pointer to Decision #9.

---

### 5. Dead asarUnpack pattern prune

**File:** `C:/github/streaming-control-panel/electron-builder.yml`

**Current state:** Lines 19-20 contain `node_modules/better-sqlite3/**/*` and
`node_modules/.pnpm/**/node_modules/better-sqlite3/**/*`. Decisions-log #6:
under hoisted pnpm, `.pnpm/` has no better-sqlite3; the `**/*.node` pattern
(line 18) already covers the native binding.

**Required change:** Remove the `node_modules/.pnpm/**/node_modules/better-sqlite3/**/*`
line (line 20). Optionally remove `node_modules/better-sqlite3/**/*` as well
(line 19) — `**/*.node` is sufficient. Keep `**/*.node`. Run `pnpm package &&
pnpm smoke:packaged` to confirm the packaged artifact still boots.

**Acceptance:** `electron-builder.yml` no longer references `.pnpm/` paths.
`pnpm smoke:packaged` green post-change.

---

### 6. Tech-design companion doc refresh

**Files:**
- `C:/github/streaming-control-panel/docs/epic-1-app-shell/tech-design-server.md`
- `C:/github/streaming-control-panel/docs/epic-1-app-shell/tech-design-client.md`
- `C:/github/streaming-control-panel/docs/epic-1-app-shell/test-plan.md`

**Current state:** Multiple spec-vs-implementation drifts:
- `tech-design-server.md:1224-1232` shows `PATHS = { auth: {login}, oauth: {callback}, liveEvents: '/live/events' }` (flat). Impl is nested: `live: { events: '/live/events' }`.
- `tech-design-server.md:87-92` references `scripts/test-e2e-placeholder.mjs`
  that no longer exists (replaced by real Playwright in Story 5).
- `tech-design-server.md:314-318` packaging section still lists
  `asarUnpack: "node_modules/better-sqlite3/**/*"` (dead under hoisting —
  see item 5).
- `tech-design-server.md` §Native Rebuild Pipeline describes `@electron/rebuild`
  via `npmRebuild: true` — impl uses explicit `rebuild:electron` +
  `npmRebuild: false` (Decision #5).
- `tech-design-server.md` §Package layout shows separate `envelope.ts`,
  `AppError.ts`, `codes.ts` — impl consolidates all three into `codes.ts`.
- `tech-design-client.md` §Package Layout shows `api/paletteApi.ts` — actual
  file is `palette/paletteApi.ts`.
- `test-plan.md:604` per-file matrix omits `tools/ci/workflow.test.ts` row.

**Required change:** Update each doc block to match the implementation. Add
back-pointers to the relevant decisions-log entries where the spec
deliberately diverged (e.g., Decision #5 for native rebuild pipeline).
Keep the "deferred items" and "open questions" sections untouched — scope
is correctness updates, not content rework.

**Acceptance:** `grep -n "liveEvents: '/live/events'\|test-e2e-placeholder\|npmRebuild: true\|api/paletteApi" docs/epic-1-app-shell/tech-design-*.md` returns nothing.

---

### 7. NavBar click navigation (disputed severity → treat as Minor-required)

**File:** `C:/github/streaming-control-panel/apps/panel/client/src/components/NavBar.tsx`

**Current state:** Lines 40-48 — PLAY/OPTIONS tab buttons call
`onGatedNavigate(tab.path)` for local flash state only. No `navigate(tab.path)`
dispatched; the URL does not change. ui-spec §NavBar commits to "Inactive
gated (PLAY/OPTIONS): triggers `<RedirectFlash>` via React Router state, then
navigates to `/`."

**Required change:** Import `useNavigate` from `react-router`. In the gated
click handler: `navigate(tab.path)` (not `'/'`). Let `RequireAuth` in
`defineRoute` produce the redirect; `RouterRedirectFlash` reads
`location.state.redirectedFrom` from the `<Navigate>` state. Remove the
`onGatedNavigate` prop plumbing from `Landing.tsx` and `NavBar.tsx` — it
becomes redundant.

Alternative (only if dispatch causes regression in Playwright baselines):
update ui-spec §NavBar to describe the current simulation-only behavior.
Either alignment, not both. Prefer code change.

**Acceptance:** Clicking "PLAY" in the rendered landing view changes the URL
to `/home` momentarily, then bounces to `/` with the access-denied flash
banner. Router-based flash replaces the prop-based flash.

---

### 8. `buildServer.test.ts` second test refactor

**File:** `C:/github/streaming-control-panel/apps/panel/server/src/server/buildServer.test.ts`

**Current state:** Lines 13-33 — test calls `result.app.listen({ host:
result.config.host, port: result.config.port })` manually and asserts the
spy received those values. Tautological: doesn't prove `startServer()` wires
config → listen.

**Required change:** Spy on `app.listen` before calling `startServer()`, not
after manual invocation. Stub the spy to resolve without binding, then call
`startServer()` (not `result.app.listen(...)`) and assert the spy received
`{ host: '127.0.0.1', port: 7077 }`. The test should fail if `startServer`
ever called `listen` with different args (e.g., `'0.0.0.0'` or a different
port).

**Acceptance:** Introducing `host: '0.0.0.0'` into `startServer()`
reproducibly fails this test.

---

### 9. Windows-only packaging scripts doc alignment

**Files:**
- `C:/github/streaming-control-panel/README.md`
- `C:/github/streaming-control-panel/docs/epic-1-app-shell/tech-design-server.md`
- `C:/github/streaming-control-panel/scripts/package-and-restore-native.mjs`
- `C:/github/streaming-control-panel/scripts/smoke-packaged.mjs`
- `C:/github/streaming-control-panel/scripts/touch-better-sqlite3-binding.mjs`
- `C:/github/streaming-control-panel/scripts/patch-local-asar-cli.mjs`

**Current state:** `smoke-packaged.mjs:6` hardcodes
`dist/packaged/win-unpacked/Streaming Control Panel.exe`. Scripts use
`taskkill /F /T` (Windows-only). `README.md:48` says "produces an Electron
artifact for your host OS in `dist/packaged/`" — implies cross-OS.

**Required change:** Choose one:
- **Option A (preferred if cheap):** Add `process.platform` branches to each
  `.mjs` script. macOS/Linux path goes to `.app`/`.AppImage` output and uses
  `child.kill('SIGTERM')`.
- **Option B (more honest):** Update `README.md` §Packaging to state:
  "Epic 1 ships Windows-only packaging automation. macOS/Linux artifacts are
  buildable via `electron-builder --mac` / `--linux` but smoke verification
  is Windows-only until the post-M3 release-engineering epic." Update
  `tech-design-server.md` §Packaging with the same scope note.

Prefer Option B — matches current scope reality; cross-OS packaging is
explicitly deferred to release-engineering post-M3 per Epic 1 §Out of Scope.

**Acceptance:** README and tech-design-server either (a) claim cross-OS AND
the scripts work cross-OS, or (b) both docs scope to Windows-only with a
pointer to the deferred release-engineering epic.

---

### 10. `smoke:packaged` SMOKE_MODE env var — wire or remove

**Files:**
- `C:/github/streaming-control-panel/scripts/smoke-packaged.mjs`
- `C:/github/streaming-control-panel/apps/panel/server/src/index.ts`
- `C:/github/streaming-control-panel/docs/epic-1-app-shell/stories/decisions-log.md`

**Current state:** `smoke-packaged.mjs:11` sets `env: { SMOKE_MODE: "1" }`.
`index.ts` never reads it. Decisions-log Decision #4 describes aspirational
`SMOKE_MODE=1` → `app.quit(0)` on `did-finish-load`. The smoke script works
via timeout + `taskkill` instead.

**Required change:** Choose one:
- **Option A:** Wire it. In `index.ts`, after `createMainWindow()` resolves,
  if `process.env.SMOKE_MODE === '1'`, attach a `did-finish-load` listener
  that calls `app.quit(0)` 1s later (so the smoke script's fetch poll can
  verify before teardown).
- **Option B:** Remove. Drop `env: { SMOKE_MODE: "1" }` from
  `smoke-packaged.mjs`. Update decisions-log Decision #4 description to
  remove the `SMOKE_MODE` paragraph — keep only the timeout + taskkill
  description.

Prefer Option A — graceful shutdown is cleaner than `taskkill /F /T`.

**Acceptance:** Either SMOKE_MODE works end-to-end OR decisions-log
description matches the code.

---

### 11. `prefers-reduced-motion` implementation

**Files:**
- `C:/github/streaming-control-panel/apps/panel/client/src/styles/globals.css` (or `fonts.css` — whichever carries animation rules)
- `C:/github/streaming-control-panel/apps/panel/client/src/components/Marquee.tsx`

**Current state:** ui-spec §8 UQ4 commits to respecting
`prefers-reduced-motion`: "marquee freezes at 0% position; scanlines remain
(static); hover translations remain." No `prefers-reduced-motion` CSS rules
exist anywhere in `apps/panel/client/src/`.

**Required change:** Add a global CSS rule:

```css
@media (prefers-reduced-motion: reduce) {
  .marquee-anim {
    animation: none;
    transform: translateX(0);
  }
}
```

Hover translations (`hover:-translate-y-0.5` / `hover:-translate-y-1`) stay
— ui-spec explicitly retains them. Scanlines stay (already static).

**Acceptance:** Setting the OS preference to "Reduce motion" and reloading
the renderer → marquee is frozen at position 0. Playwright baselines
unchanged (animations were already disabled in `toHaveScreenshot` calls).

---

### 12. `scripts/patch-local-asar-cli.mjs` review

**File:** `C:/github/streaming-control-panel/scripts/patch-local-asar-cli.mjs`

**Current state:** Script runs on every `pnpm install` via `postinstall`
hook. No reviewer documented what bug it patches in the asar CLI.

**Required change:**
1. Read the script; identify the asar CLI bug being monkey-patched and the
   asar version against which the patch was written.
2. Check `pnpm ls asar` (or equivalent) for the installed version.
3. Search the asar changelog between the patched version and latest for the
   fix.
4. If fixed upstream: bump `asar` in `package.json`, delete
   `scripts/patch-local-asar-cli.mjs`, remove the postinstall entry.
5. If not fixed upstream: add a comment block at the top of the script
   describing the bug + upstream issue link + why the monkey-patch is
   needed.

**Acceptance:** Either the patch is gone (fixed upstream) OR the script
carries documentation explaining what it does and why.

---

## Trivial — don't skip because small (8 items)

### 13. `testBypass.ts` redundant DEV check

**File:** `C:/github/streaming-control-panel/apps/panel/client/src/app/testBypass.ts`

**Change:** Delete line 32 (`if (!import.meta.env.DEV) return null;`).
`isTestBypassEnabled()` on line 31 already performs the same check.

**Acceptance:** `readForcedState` is one line shorter; tests still pass.

---

### 14. `baseSseEventSchema` unused export

**File:** `C:/github/streaming-control-panel/apps/panel/shared/src/sse/events.ts`

**Change:** Either delete `baseSseEventSchema` (lines 3-6) AND its exported
`BaseSseEvent` type, OR add the comment `// Retained as extension seam for
Epic 4a real event producers.` above it.

**Acceptance:** Either the export is gone or has a one-line rationale.

---

### 15. `braindump.md` gitignore

**Files:**
- `C:/github/streaming-control-panel/.gitignore`
- `C:/github/streaming-control-panel/braindump.md` (stays, just ignored)

**Change:** Append `braindump.md` on its own line to `.gitignore`. Run
`git check-ignore braindump.md` to confirm.

**Acceptance:** `git status` no longer shows `braindump.md` as untracked.

---

### 16. `test-plan.md` tools/ci row

**File:** `C:/github/streaming-control-panel/docs/epic-1-app-shell/test-plan.md`

**Change:** In the per-file matrix at `test-plan.md:604`, add a row:
`tools/ci/workflow.test.ts — 2 tests (TC-5.3a + TC-5.4a)`. Update the sum
line below (currently claims 75 Vitest; should be 77).

**Acceptance:** Per-file sum reconciles to 77 Vitest + 17 Playwright = 94.

---

### 17. `dev.ts` / `%TEMP%` cleanup

**Files:**
- `C:/github/streaming-control-panel/README.md`
- `C:/github/streaming-control-panel/apps/panel/server/src/server/config.ts`

**Change:** Add a note to README §Dev modes for the `pnpm --filter @panel/server dev` row: "Standalone-dev mode writes a SQLite file at
`os.tmpdir()/panel-dev.sqlite` when Electron is not loaded. Delete
manually if accumulated."

Optional: in `config.ts:33`, change the fallback filename to include a
timestamp prefix (`panel-dev-${Date.now()}.sqlite`) OR register a
`process.on('SIGINT')` cleanup in `dev.ts`. Prefer just the README note for
minimal change.

**Acceptance:** README notes the dev-mode tmpdir path.

---

### 18. Delete `RESTART-INSTRUCTIONS.md`

**File:** `C:/github/streaming-control-panel/docs/epic-1-app-shell/RESTART-INSTRUCTIONS.md`

**Change:** Delete the file. Bundle with item 1. Remove any references in
`CLAUDE.md`, `team-impl-log.md`, or stories that point at it.

**Acceptance:** `find docs/epic-1-app-shell/ -name RESTART-INSTRUCTIONS.md`
returns nothing. `grep -rn RESTART-INSTRUCTIONS docs/ CLAUDE.md` returns
nothing.

---

### 19. CI workflow `on.push` structural test

**File:** `C:/github/streaming-control-panel/tools/ci/workflow.test.ts`

**Change:** Add a third `it(...)` block to the existing `describe` at line
106:

```ts
it("TC-5.5b: workflow does not trigger on main-branch pushes", () => {
  const on = (workflow as { on?: Record<string, unknown> }).on ?? {};
  expect(Object.prototype.hasOwnProperty.call(on, "push")).toBe(false);
});
```

Update test count expectation — tools/ci now has 3 tests; total Vitest rises
to 78.

**Acceptance:** Adding `on: { push: { branches: ['main'] } }` to
`ci.yml` fails the new test.

---

### 20. `.red-ref` state verification post-PR-1

**Files:**
- `C:/github/streaming-control-panel/.red-ref` (gitignored)
- `C:/github/streaming-control-panel/docs/epic-1-app-shell/team-impl-log.md`

**Change:**
1. Check current `.red-ref` content: `cat .red-ref` (should show a commit
   SHA).
2. If the SHA is older than `6df71f8` and refers to a superseded state, write
   `6df71f8` to `.red-ref`.
3. Run `pnpm green-verify` — must pass (no test file changes since
   `6df71f8`).
4. Note the rotation in `team-impl-log.md` §Run metadata or §Process notes.

**Acceptance:** `.red-ref` contains a real SHA reachable from `main`;
`pnpm green-verify` green.

---

## Verification gate items (run once before Epic 1 acceptance commit)

### V1. Full local verification on `main`

**Why:** Finding A1 — no reviewer independently verified the claimed test
counts on HEAD.

**Commands (run from `C:/github/streaming-control-panel`):**
```bash
git log -1 --oneline               # must show 6df71f8 (or the post-cleanup SHA)
pnpm install
pnpm red-verify
pnpm verify
pnpm verify-all
```

**Acceptance:** 77 Vitest (or 78 if item 19 landed) green. 17 Playwright
green. No format/lint/typecheck errors.

---

### V2. Packaging + smoke gate

**Why:** Confirm packaged boot verification still passes after cleanup.

**Commands:**
```bash
pnpm package
pnpm smoke:packaged
```

**Acceptance:** NSIS installer built. `smoke:packaged PASS` prints to stdout.

---

### V3. Palette hex-value fidelity check

**Why:** Finding A5 — ui-spec §1 commits to "verbatim from the reference."
Never verified.

**Files:**
- `C:/github/streaming-control-panel/apps/panel/client/src/palette/palettes.ts`
- `C:/github/streaming-control-panel/docs/references/neo_arcade_palettes.jsx`

**Change:** Diff each of the 5 palette token sets in `palettes.ts` against
the corresponding palette in `neo_arcade_palettes.jsx` (lines 26-149 per
tech-design reference). Any divergence either matches a ui-spec §8 entry
(documented deviation) or is a silent drift to correct.

**Acceptance:** Every hex value matches OR the divergence has a ui-spec §8
entry.

---

### V4. Vite entry-point verification

**Why:** Finding A4 — multiple reports flagged
`apps/panel/client/src/index.ts` as suspicious without checking.

**File:** `C:/github/streaming-control-panel/apps/panel/client/index.html`

**Change:** Open `index.html`, confirm the `<script type="module" src="...">`
points at `/src/main.tsx`, not `/src/index.ts`. If `index.ts` is unused,
delete it.

**Acceptance:** `index.html` loads `main.tsx`. `index.ts` either removed or
justified with an inline comment explaining its role.

---

## Deferred / accepted risk (NOT fixing in this batch)

These items were reviewed in synthesis; explicit decision to defer:

- **`smoke:packaged` not in CI** — accepted deferral per decisions-log #9;
  post-M3 release-engineering epic.
- **`SignInProvider` pattern beyond tech-design spec** — defensible
  refactor; document in `decisions-log.md` as Decision #12 when Item 6
  (doc refresh) lands.
- **Three near-identical 401 tests in `liveEvents.test.ts`** — spec-directed
  per test-plan's per-TC-per-test mapping. Address in Epic 2 test-plan
  evolution.
- **`pnpm rebuild:electron` DX latency on every `pnpm start`** — Epic 2
  optimization with cached ABI check.
- **`RedirectFlash` timer edge case on prop change** — practically guarded
  by React `key` remount.
- **Cookie secret env-var injection** — Epic 2 Story 0 responsibility (first
  story to issue session cookies).
- **`scripts/codex/` harness tests** — orchestration tooling, not product
  code.
- **End-to-end server → error-card integration test** — Epic 2 Story 0
  responsibility.

---

## Sequencing notes for implementer teammate

The fix batch should land as a single commit `fix: pre-verification cleanup`
unless items conflict. Suggested order:

1. Items 18, 15, 13, 14 (pure deletions / trivial edits)
2. Item 1 (CLAUDE.md rewrite — no other file depends on it)
3. Item 6 (doc refresh) — can parallelize with code changes
4. Items 2, 8, 19 (test updates) in one test-file batch
5. Items 7, 11, 13 (renderer tweaks) — regenerate Playwright baselines ONLY
   if 7 or 11 changes pixel output; `animations: disabled` should insulate
   most changes
6. Items 4, 5 (packaging config) together — both hit `electron-builder.yml` +
   `package.json` and need `pnpm smoke:packaged` to re-verify
7. Items 9, 10, 12, 17 (scripts + docs) last — lowest risk
8. Item 3 (S1 investigation) — requires a fresh Windows clone; may be
   a separate follow-up if infrastructure slows the batch
9. Item 20 (`.red-ref` rotation) — absolute last; after the cleanup commit
   lands, rotate to the new SHA

Verification gates V1-V4 run after all items land, not per-item.

---

*This file replaces the Categorized fix list section of `synthesis.md` as the
canonical handoff source. If an item is contested, update `synthesis.md` first,
then regenerate the relevant entry here.*
