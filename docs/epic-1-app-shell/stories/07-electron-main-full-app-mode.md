# Story 7: Electron Main Process + Full-App Mode

### Summary
<!-- Jira: Summary field -->

Host the Fastify server and React renderer inside Electron 41, register the `app://` protocol for the production renderer, make `pnpm start` boot the full app to the landing view with HMR, and seed README dev-mode docs.

### Description
<!-- Jira: Description field -->

**User Profile:** Streamer launches the app via `pnpm start` (developer) or a packaged artifact (Story 8) and sees exactly one renderer window displaying the landing view. Developer edits renderer source and sees the change hot-reload without an Electron restart.

**Objective:** Wire the Electron main process. The main-process entry starts Fastify first (server binds `127.0.0.1:7077`, migrations apply) then awaits `app.whenReady()` and creates one `BrowserWindow` with context isolation, sandboxing, and no node integration. Privileged-scheme registration for `app://` happens at module load time — **before** `app.whenReady()` resolves — because Electron's `protocol.registerSchemesAsPrivileged` contract requires it. The matching `protocol.handle('app', ...)` wiring happens after `whenReady`. In dev mode, the window loads from `ELECTRON_RENDERER_URL` (Vite dev server via electron-vite); in production, from `app://panel/index.html`. Native Electron chrome (tech design D14). README gets the full dev-mode table.

**Scope — In:**
- `electron-vite` 5 installed; `electron.vite.config.ts` at repo root configuring main / preload / renderer builds with `externalizeDepsPlugin()` for main
- `apps/panel/server/src/index.ts` — entry: `await startServer()`, then `await startElectron({ serverUrl })`
- `apps/panel/server/src/electron/app.ts` — two-phase wiring:
  - **At module load (before `app.whenReady()` resolves):** `protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: false } }])` — Electron requires privileged-scheme registration before ready
  - **`startElectron({ serverUrl })` (after `app.whenReady()`):** installs `protocol.handle('app', ...)` serving files from `dist/renderer/`, calls `createMainWindow()`
- `apps/panel/server/src/electron/window.ts` — `createMainWindow()`: 1280×800 default, 960×600 minimum, `contextIsolation: true, nodeIntegration: false, sandbox: true`, loads `ELECTRON_RENDERER_URL` in dev or `app://panel/index.html` in production
- Root `package.json` scripts: `start` and `dev` both run `electron-vite dev`
- Renderer HMR through electron-vite's injection of `ELECTRON_RENDERER_URL`
- README full dev-mode section: three modes (`pnpm --filter client dev`, `pnpm --filter server dev`, `pnpm start`) with use cases, ports, and links to `testBypass` URL flags for Playwright verification

**Scope — Out:**
- Packaging with electron-builder (Story 8)
- Frameless / custom window chrome — deferred post-M3 per D14
- Preload IPC scripts — empty slot reserved; no preload content in Epic 1
- Auto-update — Future Direction

**Dependencies:** Stories 3, 4, 6. Story 3 (Data Layer) is what makes the server-starts-first ordering meaningful — migrations must apply before Fastify accepts requests. Story 4 ships the real server-side gate. Story 6 ships the renderer router.

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

**AC-1.1:** Launching the app opens exactly one primary renderer window displaying the landing view.

- **TC-1.1a: Packaged build opens to landing**
  - Given: A packaged Electron artifact produced by this epic's build command
  - When: The user launches the artifact
  - Then: Exactly one renderer window opens and the landing view is visible
  - *Verification:* Observed-run. The packaged artifact comes from Story 8; this TC is re-verified there. This story's contribution is the single-window `createMainWindow()` invocation.
- **TC-1.1b: Full-app dev mode opens to landing**
  - Given: A freshly cloned repo with `pnpm install` complete
  - When: The developer runs `pnpm start`
  - Then: Exactly one Electron window opens and the landing view is visible
  - *Verification:* Observed-run.

**AC-3.1:** `pnpm start` launches Electron with Fastify + Vite + renderer and boots to the landing view.

- **TC-3.1a: Full-app mode starts**
  - Given: Repo is installed
  - When: The developer runs `pnpm start`
  - Then: An Electron window opens to landing
  - *Verification:* Observed-run.

**AC-3.2:** In full-app mode, renderer source-file changes are reflected in the running renderer without an Electron restart (hot reload).

- **TC-3.2a: Renderer hot reload**
  - Given: Full-app mode is running
  - When: The developer saves a change to a renderer source file
  - Then: The change is visible in the renderer without an Electron restart
  - *Verification:* Observed-run.

**AC-3.5:** All three dev modes are documented in the repo's README with the command, the use case, and any setup prerequisites.

- **TC-3.5a: Dev-mode documentation exists**
  - Given: A freshly cloned repo
  - When: The developer reads the README
  - Then: All three commands from AC-3.1, AC-3.3, AC-3.4 are listed with brief descriptions
  - *Verification:* Assertable — `server/src/electron/readme.test.ts` greps the README for the three commands.

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**Bootstrap sequence (full app cold start):**

```
pnpm start
  → electron-vite dev
  → starts Vite renderer dev server on :5173 (dev only)
  → spawns main process with ELECTRON_RENDERER_URL injected
  → [module load] protocol.registerSchemesAsPrivileged(['app'])  ← MUST precede whenReady
  → startServer():  openDatabase → applyMigrations → buildServer → listen(127.0.0.1:7077)
  → startElectron():  app.whenReady → protocol.handle('app', ...) → createMainWindow → loadURL
  → renderer mounts: React 19 → <App /> → <PaletteProvider> → <RouterProvider> → Landing
```

Server starts before Electron so the renderer never races against an unready server or unapplied migrations.

**`app://` protocol registration:**

| Privilege | Value | Reason |
|-----------|-------|--------|
| `standard` | `true` | Chromium treats `app://panel` as a real origin (not `null`); renderer fetches carry `Origin: app://panel` — matches Story 4's allowed-origin set |
| `secure` | `true` | Allows fetch/XHR under secure-context rules |
| `supportFetchAPI` | `true` | `fetch()` works from renderer to `app://` resources |
| `corsEnabled` | `false` | Same-origin only; the server's Origin preHandler is the trust boundary |

Handler: `protocol.handle('app', (request) => { const filePath = path.join(RENDERER_ROOT, url.pathname === '/' ? '/index.html' : url.pathname); return net.fetch(pathToFileURL(filePath).toString()); })`.

**BrowserWindow hardening:**

| Setting | Value |
|---------|-------|
| `contextIsolation` | `true` |
| `nodeIntegration` | `false` |
| `sandbox` | `true` |
| Width × Height | 1280 × 800 default |
| Min Width × Min Height | 960 × 600 |

**Renderer load URL:**

| Mode | URL |
|------|-----|
| Dev (`pnpm start`) | `ELECTRON_RENDERER_URL` (Vite dev server) |
| Production (packaged) | `app://panel/index.html` |

**README dev-mode table (added by this story):**

| Command | Use case | Port |
|---------|----------|------|
| `pnpm --filter client dev` | Renderer-only iteration, no server required | 5173 |
| `pnpm --filter server dev` | Fastify standalone, for server-side work | 7077 |
| `pnpm start` | Full Electron app (server + renderer + main process) with HMR | 5173 (renderer) + 7077 (server) |

**Test file for this story:** `server/src/electron/readme.test.ts` — 1 test (TC-3.5a: grep README for the three commands).

**Observed-run TCs this story adds to the checklist:** TC-1.1a (re-verified in Story 8), TC-1.1b, TC-3.1a, TC-3.2a, TC-9.3a (the SQLite-rebuild validation lands its first observation when `pnpm start` opens the file without a native-module error).

See [`../tech-design-server.md`](../tech-design-server.md) §Electron Shell, §Window Management, and §Packaging for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] `pnpm start` opens exactly one Electron window at the landing view
- [ ] Fastify binds `127.0.0.1:7077` and migrations apply before the window loads
- [ ] `protocol.registerSchemesAsPrivileged` is called at module load (before any `app.whenReady()` resolution) with the listed privileges
- [ ] `protocol.handle('app', ...)` installed inside the `app.whenReady()` continuation, before `createMainWindow()`
- [ ] `BrowserWindow` uses `contextIsolation: true, nodeIntegration: false, sandbox: true`
- [ ] Dev mode loads from `ELECTRON_RENDERER_URL`; production load from `app://panel/index.html`
- [ ] Editing a renderer source file during `pnpm start` updates the renderer without an Electron restart (observed)
- [ ] README dev-mode table lists all three modes, their use cases, and ports
- [ ] `server/src/electron/readme.test.ts` passes (TC-3.5a grep assertion)
- [ ] Observed-run checklist updated for TC-1.1b, TC-3.1a, TC-3.2a, TC-9.3a
- [ ] `pnpm verify` passes
