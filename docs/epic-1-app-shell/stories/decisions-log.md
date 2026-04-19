# Epic 1 Decisions Log — What We Missed & Need to Update

Running ledger of architectural decisions, spec defects, and doc-update TODOs surfaced during Story-by-story implementation. Each entry links the decision to the documentation that needs to change so future epics don't re-learn the same lessons.

Sorted newest → oldest.

---

## 2026-04-18 · Story 8 whenReady TLA hang (packaged only)

**Surfaced by:** TC-4.2a observed-run. Main process started, Fastify bound port 7077, but `await app.whenReady()` inside `startElectron` never resolved — no window, no child processes, no remote-debugging port. Dev mode (`pnpm start`) unaffected because dev flow doesn't use the same TLA sequence.

**Root cause:** In packaged ESM Electron 41 main with top-level-await chain `await startServer()` → `await startElectron()` → `await app.whenReady()`, the ready-promise never settled. Likely an ESM+TLA+Electron ready-event interaction bug.

**Fix:** Rewrote `apps/panel/server/src/index.ts` to use idiomatic `app.whenReady().then(...)` pattern — registers the ready callback synchronously at module load rather than through a TLA chain. Removed the redundant `await app.whenReady()` inside `startElectron`. Added `app.requestSingleInstanceLock()` to prevent double-launches causing EADDRINUSE.

**Docs to update:** None pending — this is the fix itself. Worth noting in `docs/v2-findings/013` as a fourth packaging-only defect class when that writeup is drafted.

---

## 2026-04-18 · Story 8 Packaging Research — pnpm + Electron + native + non-JS assets

**Surfaced by:** Three consecutive observed-run-only Criticals in Story 8 (hollow asar → native ABI mismatch → missing Drizzle migrations). Each passed `pnpm verify` + dual review + artifact-shape structural gates. Caught only when the user double-clicked the installer.

Five research agents converged on the root cause + corrective architecture. Findings below with the doc updates each one requires.

### 1. **ROOT CAUSE: Missing `node-linker=hoisted` in `.npmrc`**

**Decision:** Add `node-linker=hoisted` to root `.npmrc`. This is the single highest-leverage fix — without it, pnpm's default symlinked `.pnpm/` store layout trips electron-builder's traversal, `@electron/rebuild` can't reliably write-back through symlinks, and every packaging workaround we accrue is a symptom.

**Consequences:** Under hoisted, pnpm produces an npm-flat `node_modules/`. electron-builder's default `node_modules/**` inclusion then works natively, several Story 8 workarounds become unnecessary (see Decisions #3, #4, #5 below).

**Why we missed it:** Story 0 scaffolded `.npmrc` with `prefer-workspace-packages=true` only; no `node-linker` setting. The default symlinked layout works fine for dev/test and for `pnpm start` (Electron's dev-mode loader doesn't care). Packaging is the first consumer that breaks.

**Docs to update:**
- `docs/architecture.md` — add a "pnpm configuration" subsection specifying `node-linker=hoisted` as mandatory for any workspace producing a packaged artifact. Cite this log entry.
- `docs/epic-1-app-shell/tech-design-server.md` §Packaging — prepend a "Prerequisites: `.npmrc` must set `node-linker=hoisted`" note. Reference issue [electron-builder #7555](https://github.com/electron-userland/electron-builder/issues/7555).
- `docs/epic-1-app-shell/stories/00-foundation.md` (retrospectively, or via a sidecar annotation) — Story 0's `.npmrc` DoD should have included `node-linker=hoisted`.
- `CLAUDE.md` — add to the "Current state" section a one-liner noting the hoisted pnpm linker is required for packaging.

**Sources:** [electron-builder #6289](https://github.com/electron-userland/electron-builder/issues/6289), [electron-builder #7555](https://github.com/electron-userland/electron-builder/issues/7555), [pnpm discussion #5146](https://github.com/orgs/pnpm/discussions/5146).

### 2. **Electron-vite renderer `outDir` with `..` silently fails on Windows**

**Decision:** renderer `build.outDir` must be a `path.resolve(__dirname, ...)` absolute path. Story 7's original `"../server/dist/renderer"` (relative to `root: 'apps/panel/client'`) printed file names to stdout but never wrote them to disk on Windows. `pnpm start` (dev mode) didn't exercise the build path, so the defect was latent until Story 8 ran `electron-vite build`.

**Why we missed it:** Story 7's DoD used `pnpm start` for observed-run verification, which serves the renderer via Vite dev server without invoking `build`. The `electron-vite build` codepath had no gate before Story 8.

**Docs to update:**
- `docs/epic-1-app-shell/tech-design-server.md` §Packaging — update the `electron.vite.config.ts` code block to use absolute paths for all three `outDir` values. Add a callout: "On Windows, `..`-relative outDir paths cause silent write failures under Vite 8 + electron-vite 5."
- `docs/v2-findings/013-observed-run-only-packaging-defects.md` (new, planned post-Story-8 acceptance) — primary repository of this class of finding.

**Source:** Empirical reproduction during Story 8 fix round 1.

### 3. **Drizzle migrations: `files:` (asar) beats `asarUnpack` or `extraResources`**

**Decision:** Add `apps/panel/server/drizzle/**` to `electron-builder.yml` `files:`. Drizzle's `readMigrationFiles` uses `fs.readFileSync` + `fs.existsSync` + `fs.readdirSync`, all of which work through Electron's patched fs inside asar. No code change in `apps/panel/server/src/data/db.ts` needed — the existing `path.resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle')` resolves correctly inside `resources/app.asar/apps/panel/server/dist/main/index.js` → `resources/app.asar/apps/panel/server/drizzle/`.

**Why we missed it:** Neither the story DoD, test plan, nor dual review included "verify runtime assets other than JS are included." `pnpm verify`'s server Vitest suite uses `:memory:` SQLite and never invokes migrations from the real filesystem layout.

**Why NOT `asarUnpack`:** Works but unnecessary overhead — migration SQL is read-only, small, and already-colocated with bundled main code. asarUnpack is only load-bearing for native binaries (dlopen can't traverse asar) or for libraries that bypass Electron's fs patch.

**Why NOT `extraResources`:** Would require a code change in `db.ts` to branch on `app.isPackaged` and use `process.resourcesPath`. Unnecessary for local-first app without sensitive DDL.

**Docs to update:**
- `docs/epic-1-app-shell/tech-design-server.md` §Packaging — add `apps/panel/server/drizzle/**` to the `files:` YAML block. Add a "Non-JS runtime assets" subsection explaining the decision tree (files=asar, asarUnpack=native binaries, extraResources=sidecars/user-replaceable).
- `docs/epic-1-app-shell/test-plan.md` — Story 8's test mapping should note that observed-run TC-4.2a implicitly exercises migrations, and packaging must include the drizzle folder.

**Sources:** [drizzle-orm discussion #1891](https://github.com/drizzle-team/drizzle-orm/discussions/1891), [drizzle-orm/src/migrator.ts](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/migrator.ts).

### 4. **Boot-time verification gate: Playwright-electron launching the unpacked artifact**

**Decision:** Add `scripts/smoke-packaged.mjs` using `_electron.launch({ executablePath })` against `dist/packaged/win-unpacked/<AppName>.exe`. Probe a live endpoint (e.g., `http://127.0.0.1:7077/health`) so migrations actually run. Add `smoke:packaged` to `package.json#scripts` and append to `verify-all`.

**Why we missed it:** The harness gate `pnpm red-verify && pnpm verify && pnpm verify-all` is entirely dev-path. Packaging produces an artifact that only human observed-run exercises. Three distinct Story 8 defects slipped through because no automated gate launched the packaged .exe.

**Canonical pattern:** VS Code's smoke test suite, Actual Budget's 2025 GitHub Actions flow ([actualbudget/actual#4674](https://github.com/actualbudget/actual/pull/4674)), and [spaceagetv/electron-playwright-example](https://github.com/spaceagetv/electron-playwright-example).

**Gotcha:** Playwright's `firstWindow()` can hang on packaged exe with strict `contextIsolation` and no devtools ([microsoft/playwright#21117](https://github.com/microsoft/playwright/issues/21117), [#32759](https://github.com/microsoft/playwright/issues/32759)). Mitigations: `ELECTRON_ENABLE_LOGGING=1` to surface main-process throws; `SMOKE_MODE=1` is now wired in `apps/panel/server/src/index.ts` so the main window quits 1s after `did-finish-load`, letting the smoke script's fetch poll pass before teardown while `taskkill /F /T` remains the fallback cleanup path.

**Docs to update:**
- `docs/epic-1-app-shell/tech-design-server.md` §Verification Scripts — add `smoke:packaged` as a new gate between `verify` and `verify-all`.
- `docs/epic-1-app-shell/test-plan.md` — note that TC-4.1a / TC-4.2a are now partially automated via `smoke:packaged`, with human observed-run retained for visual confirmation.
- `ls-tech-design-v2` / `ls-team-impl-v2` upstream skill feedback (via `docs/research/`) — flag that any epic producing a packaged desktop artifact must include a boot-time verification gate, not only dev-path `pnpm verify`.

**Source:** Research agent synthesis from Story 8.

### 5. **Native ABI rebuild: `@electron/rebuild` via `npmRebuild: true` doesn't write-back under pnpm**

**Decision:** Use explicit `pnpm rebuild:electron` (Story 7's working script: `electron-rebuild -f -w better-sqlite3 --module-dir apps/panel/server`) prepended to the `package` script; set `npmRebuild: false` in `electron-builder.yml`. `@electron/rebuild`'s internal traversal logs "finished" but doesn't reliably rewrite pnpm's hoisted store binding — likely related to symlink following + write-back paths.

**Post-hoisting note:** Under `node-linker=hoisted` (Decision #1), `@electron/rebuild` may work correctly again because the binding lives in a real directory. Re-evaluate this decision once hoisted is in place — if `npmRebuild: true` works post-hoist, we can simplify by removing the explicit rebuild:electron prepend.

**Why we missed it:** Test suite uses `:memory:` SQLite without requiring the native binding's ABI to match Electron. `pnpm verify` passes regardless of whether the packaged `.node` is Node ABI 137 or Electron ABI 145.

**Docs to update:**
- `docs/epic-1-app-shell/tech-design-server.md` §Native Rebuild Pipeline — rewrite to show the explicit `rebuild:electron` + `npmRebuild: false` flow as the primary, with a note about re-evaluating post-hoisting.

**Source:** Story 8 observed-run failure (`NODE_MODULE_VERSION 137 vs 145`) + orchestrator diagnosis (packaged binding byte-identical to Apr-12 pnpm-install artifact).

### 6. **Kill the dead `node_modules/better-sqlite3/**/*` asarUnpack pattern**

**Decision:** Under pnpm (hoisted or not), better-sqlite3 lives under `.pnpm/`. The `node_modules/better-sqlite3/**/*` asarUnpack entry matches nothing. The active pattern is `**/*.node`. Keep both for defense OR prune the dead line; either is functionally equivalent, but pruning clarifies the config.

**2026-04-19 cleanup outcome:** `electron-builder.yml` now keeps only `**/*.node` in `asarUnpack`. The dead `better-sqlite3` path patterns are gone.

**Docs to update:**
- `docs/epic-1-app-shell/tech-design-server.md` §Packaging — drop the `node_modules/better-sqlite3/**/*` line from the asarUnpack example YAML (or annotate it as "pnpm-non-hoisted defense, optional").

### 7. **`extraMetadata.main` pattern (from mdv reference repo)**

**Decision (optional, deferred):** `extraMetadata.main` in `electron-builder.yml` can rewrite the packaged `package.json`'s main field without mutating the source. Currently Story 8 added `"main": "apps/panel/server/dist/main/index.js"` at source-root which is correct but ties the source package to the build layout.

**Why NOT urgent:** Our current approach works. `extraMetadata.main` is a cleanup opportunity, not a defect.

**Docs to update:**
- `docs/architecture.md` / `docs/epic-1-app-shell/tech-design-server.md` — optional note about the pattern for future epics.

**Source:** mdv reference repo at `C:/github/mdv/electron-builder.yml`.

### 8. **Package.json root-level `name` + `version` are packaging requirements**

**Decision:** `"name": "streaming-control-panel"` + `"version": "0.0.0"` at root `package.json` are REQUIRED by electron-builder for app-identity resolution (NSIS installer version, productName fallback). Story 0 originally had `"private": true` without name/version; Story 8 impl added them and we dispositioned as kept.

**Docs to update:**
- `docs/epic-1-app-shell/tech-design-server.md` / `docs/architecture.md` — note that root package.json requires `name` + `version` for packaging. Recommend `"description"` and `"author"` additions in a future epic (electron-builder emits advisory warnings for their absence).

### 9. **Story 8 root-level runtime deps workaround will be removed under hoisted pnpm**

**Decision:** Fix round 1 added 7 runtime deps (`better-sqlite3`, `fastify`, `@fastify/cookie`, `fastify-type-provider-zod`, `drizzle-orm`, `iron-session`, `zod`) to root `package.json` so electron-builder's workspace traversal found them. This was a pnpm-symlink workaround. Under `node-linker=hoisted` (Decision #1), these should be removable.

**2026-04-19 cleanup outcome:** The root `dependencies` block has been removed. `pnpm install`, `pnpm red-verify`, `pnpm verify`, and `pnpm verify-all` all stayed green locally without it; packaged-artifact verification remains the orchestrator's separate V2 pass.

**Docs to update:**
- When fix-4 lands: document the removal in the Story 8 transition checkpoint + flag the `dependencies` block should NOT be re-added by future stories without strong justification.

### 10. **Bundle redundancy: `@electron/rebuild` in root devDependencies**

**Decision (deferred):** electron-builder 26.8+ includes `@electron/rebuild` internally; the explicit root devDependency is redundant. electron-builder's own advisory warning confirms this.

**Why deferred:** We currently call the electron-rebuild CLI directly via `rebuild:electron` script, which needs the package to exist as a resolvable binary. If we switch to using electron-builder's bundled rebuild, the explicit dep can be dropped. Batch this with post-M3 release-engineering cleanup.

### 11. **Retain local `@electron/asar` CLI slash-normalization patch**

**Decision:** Keep `scripts/patch-local-asar-cli.mjs` for now. The installed package is `@electron/asar` 3.4.1; latest published npm version is 4.2.0; both the latest published CLI and the current upstream `main` branch still print raw `files[i]` values in the `list` command, so Windows output remains backslash-delimited.

**Why retained:** Our packaging/tooling flow expects parseable, host-stable `asar list` output. Until upstream normalizes Windows paths or exposes a machine-readable mode, the local patch remains the least invasive fix.

**Docs to update:**
- `scripts/patch-local-asar-cli.mjs` — add an inline comment block describing the bug, the checked upstream status, and the patched version range.

---

## Standing TODOs (cross-cutting)

- [ ] Post-Story-8 acceptance: write `docs/v2-findings/013-observed-run-only-packaging-defects.md` consolidating Decisions #1-#6 above. This is the primary upstream-skill feedback deliverable.
- ✅ LANDED Story 8 cleanup: `docs/architecture.md` §pnpm Configuration subsection added citing Decision #1.
- ✅ LANDED Story 8 cleanup: `CLAUDE.md` "What this repo is" updated with one-sentence `.npmrc` `node-linker=hoisted` note citing Decision #1.
- ✅ LANDED Story 8 cleanup: `docs/epic-1-app-shell/test-plan.md` Chunk 8 cross-cutting verification note added for `pnpm smoke:packaged` alongside TC-4.1a/TC-4.2a (Decision #4).
- ✅ LANDED Story 8 cleanup: `docs/epic-1-app-shell/stories/00-foundation.md` sidecar annotation appended noting retroactive DoD gap on `node-linker=hoisted` (Decision #1).
- ✅ LANDED pre-Epic-2 cleanup: `docs/epic-1-app-shell/tech-design-server.md` §Packaging + §Native Rebuild Pipeline now reflect the hoisted-pnpm rebuild flow, Windows-only automation scope, and the pruned `asarUnpack` config.
- [ ] When Story 9 (CI workflow) runs: `ci.yml` must include `pnpm smoke:packaged` as a gate (or accept that packaged-artifact verification is local-only until release-engineering epic).
- [ ] When Epic 2 (Twitch OAuth + keytar) runs: keytar is another native dep; add to `pnpm.onlyBuiltDependencies` and verify the rebuild:electron script catches it.

---

## How to use this log

- **Before starting a new story:** skim this log for decisions that might apply. Entries are tagged with the docs they amend — check those docs are current.
- **When surfacing a new spec defect / architectural decision:** add a dated entry here. Note which docs need updates. If the update lands in the same story, mark it done. If deferred, it goes into the Standing TODOs list above.
- **This log is not a transition checkpoint.** Those live in `team-impl-log.md`. This log is doc-drift prevention — a durable record of "things we found out late that the spec should have said upfront."
