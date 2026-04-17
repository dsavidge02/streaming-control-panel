# Story 8: Packaged Build for Developer OS

### Summary
<!-- Jira: Summary field -->

Configure electron-builder 26.8 to produce a host-OS-appropriate Electron artifact via `pnpm package`; verify the artifact launches to landing.

### Description
<!-- Jira: Description field -->

**User Profile:** Developer produces a packaged artifact on their host OS that runs as a standalone desktop app.

**Objective:** Deliver the packaging chain. electron-builder reads `electron-builder.yml` at the repo root, packs `dist/main/`, `dist/preload/`, `dist/renderer/`, and `node_modules/` into a host-OS installer or app bundle. `better-sqlite3`'s native binary is kept out of `asar` via `asarUnpack` rules so it loads at runtime. electron-builder's `npmRebuild: true` belt-and-suspenders with the Story 0 postinstall. No cross-OS matrix, no code signing, no release pipeline in Epic 1 — host OS only.

**Scope — In:**
- `electron-builder` 26.8 installed as a dev dependency
- `electron-builder.yml` at repo root with `appId`, `productName`, `directories.output: dist/packaged`, `files` list, `asar: true`, `asarUnpack` rules for `**/*.node` and `better-sqlite3`
- Root `package` script: `electron-vite build && electron-builder`
- Per-OS target blocks: `win → nsis`, `mac → dir, dmg`, `linux → AppImage` (only the host OS runs at package time; other targets are scaffolding for post-M3)
- README packaging section: command name, output location, note that cross-OS installers are deferred post-M3
- Observed-run verification that a launched artifact opens to landing

**Scope — Out:**
- Code signing (Windows Authenticode, macOS notarization) — deferred post-M3
- Cross-OS matrix builds — deferred post-M3
- Release pipeline / auto-update channel — deferred post-M3
- Publishing to distribution channels (Mac App Store, Microsoft Store, Snap) — rejected at product level

**Dependencies:** Story 7 (Electron shell boots via `pnpm start`; packaging wraps the same entry).

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

**AC-4.1:** A single `pnpm` command produces an Electron-packaged artifact appropriate for the developer's host OS in a repo-local output directory. The command name is a tech-design choice; the behavior is fixed. Chosen name: `pnpm package`.

- **TC-4.1a: Packaging command produces an artifact**
  - Given: Repo is installed on the developer's host OS
  - When: The developer runs `pnpm package`
  - Then: A host-OS-appropriate Electron artifact (`.exe`/nsis on Windows, `.app`/`.dmg` on macOS, `.AppImage` on Linux) is present in `dist/packaged/`
  - *Verification:* Observed-run.

**AC-4.2:** The packaged artifact launches and opens to the landing view per AC-1.1.

- **TC-4.2a: Packaged artifact boots to landing**
  - Given: A packaged artifact from AC-4.1
  - When: The user launches it outside of `pnpm start`
  - Then: A renderer window opens to the landing view
  - *Verification:* Observed-run. Re-verifies TC-1.1a from Story 7.

**AC-4.3:** The packaging command is documented in the README alongside the dev-mode commands.

- **TC-4.3a: Packaging documented**
  - Given: The README lists dev modes
  - When: The developer scans for the packaging command
  - Then: The command is present with a note that it targets the host OS only
  - *Verification:* Assertable — `server/src/electron/readme-package.test.ts` greps the README for `pnpm package`.

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**`electron-builder.yml` key configuration:**

| Key | Value | Reason |
|-----|-------|--------|
| `appId` | `com.streamingpanel.app` | Required by most OSes for install identity |
| `productName` | `Streaming Control Panel` | Drives `app.getPath('userData')` folder name |
| `directories.output` | `dist/packaged` | Repo-local output |
| `files` | `dist/main/**`, `dist/preload/**`, `dist/renderer/**`, `node_modules/**`, `package.json` | Exhaustive: native modules need `node_modules` at runtime |
| `asar` | `true` | Default bundling |
| `asarUnpack` | `**/*.node`, `node_modules/better-sqlite3/**/*` | Native binaries must be extractable at runtime |
| `npmRebuild` | `true` | electron-builder invokes `@electron/rebuild` before packaging (belt-and-suspenders with Story 0 postinstall) |

**Per-OS targets:**

| OS | Target |
|----|--------|
| Windows | `nsis` |
| macOS | `dir`, `dmg` (unsigned in Epic 1) |
| Linux | `AppImage` |

Only the host OS's target runs per `pnpm package` invocation — cross-compilation is not in scope.

**Native-module pipeline recap:**

```
pnpm package
  → electron-vite build  (main + preload + renderer bundles)
  → electron-builder
     → @electron/rebuild (via npmRebuild: true)
     → asar pack with asarUnpack exclusion for *.node
     → per-host-OS installer output in dist/packaged/
```

**README packaging section (added by this story):**

> **Packaging:** `pnpm package` produces an Electron artifact for your host OS in `dist/packaged/`. Cross-OS installers and code signing are deferred until after M3.

**Test file for this story:** `server/src/electron/readme-package.test.ts` — 1 test (TC-4.3a grep).

**Observed-run TCs this story adds:** TC-4.1a, TC-4.2a (re-verifies TC-1.1a end-to-end on a packaged artifact).

See [`../tech-design-server.md`](../tech-design-server.md) §Packaging for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] `electron-builder` 26.8 installed
- [ ] `electron-builder.yml` matches the config table above
- [ ] Root `package` script is `electron-vite build && electron-builder`
- [ ] `pnpm package` on the host OS produces an artifact in `dist/packaged/`
- [ ] Launched packaged artifact opens to the landing view (observed)
- [ ] README packaging section references `pnpm package` and notes cross-OS deferred post-M3
- [ ] `server/src/electron/readme-package.test.ts` passes
- [ ] Observed-run checklist updated for TC-4.1a, TC-4.2a, and TC-1.1a (re-verified on packaged artifact)
- [ ] `pnpm verify` passes
- [ ] `pnpm verify-all` passes (Playwright baselines unchanged after packaging path)
