# Epic 1: App Shell & Landing

This epic delivers the Electron app shell, landing view, route gating, and the cross-cutting infrastructure every later epic inherits: monorepo layout, Fastify server, React renderer, Data Layer wiring, typed error envelope, localhost trust boundary, and CI.

Source: PRD Feature 1 (`docs/prd.md`) and the App Shell top-tier domain in `docs/architecture.md`.

**Scope note:** PRD Feature 1 (as of the `docs/prd.md` revision accompanying this epic) includes the foundational platform work — monorepo scaffold, shared contracts, server + renderer wiring, persistence bootstrap, trust boundary, error envelope, and CI — alongside the streamer-visible shell behavior. This epic decomposes PRD AC-1 and AC-2 into line-level ACs and TCs; both artifacts describe the same Epic 1.

---

## User Profile

**Primary User:** A solo Twitch streamer launching the installed app for the first time, before any authentication exists.
**Context:** They've downloaded the packaged build (or a developer has cloned the repo and run `pnpm start`) and are opening the app to see what it is.
**Mental Model:** "I opened the app. I should see what it does. There should be an obvious way in."
**Key Constraint:** Nothing downstream works yet — no Twitch OAuth, no channel management, no live features. The landing view and the gate are the entire streamer-visible surface until Epic 2 ships.

The developer is a secondary actor for dev-mode, packaging, and CI flows. Developer-facing flows name the developer as the actor in prose.

---

## Feature Overview

A streamer launches the app and sees a landing view with a product description and an active "Sign in with Twitch" button. Clicking the button calls a server endpoint that returns a typed `NOT_IMPLEMENTED` error in this epic; Epic 2 replaces the endpoint body with the real OAuth flow without changing any landing-view contract. Any attempt to reach a non-landing route without a session returns the user to landing.

A developer can run the full app in Electron, the renderer alone in a browser, or the Fastify server alone, and can produce an Electron-packaged artifact for their host OS. CI runs lint, typecheck, and unit tests on every pull request against `main`.

---

## Scope

### In Scope

- Landing view containing the product name, a one-sentence description, a five-item capability list (channel management, live moderation, clip creation, custom `!commands`, welcome bot), and an active "Sign in with Twitch" button that calls `POST /auth/login`
- `POST /auth/login` stub that returns HTTP 501 with error envelope `{ code: "NOT_IMPLEMENTED" }`; Epic 2 replaces the body with the OAuth redirect
- Centralized unauthenticated route gating: redirect-to-landing on the client, 401 on server-side gated routes, `/oauth/callback` and `/auth/login` on a declared exempt-path list
- Three dev modes: full Electron (`pnpm start`), renderer-only (`pnpm --filter client dev`), server-only (`pnpm --filter server dev`)
- Packaged Electron artifact for the developer's host OS
- CI workflow on pull request running on Ubuntu Linux: lint, typecheck, unit tests
- Fastify server running inside the Electron main process on `127.0.0.1:7077`, with the HTTP surface registered through a single central router
- Stub HTTP endpoints: `/oauth/callback` returns 501 `NOT_IMPLEMENTED`, `/live/events` emits heartbeat SSE to authenticated subscribers
- Localhost trust boundary: Origin-header validation on state-changing routes (session cookie defaults and issuance land with Epic 2)
- Typed error envelope and append-only error-code registry
- Data Layer bootstrap: SQLite file at the OS userData path, `better-sqlite3` built against Electron's Node ABI, Drizzle migration runner, one baseline migration, no feature tables
- Empty `/settings` route placeholder that Epic 2 populates with the Reset action
- Shared package at `apps/panel/shared/` (per architecture) containing the error envelope, error-code registry, HTTP route path constants, and SSE event schema

### Out of Scope

- **Twitch OAuth flow** — Epic 2. `POST /auth/login` is a 501 stub in this epic.
- **Authenticated functionality** — every downstream epic. Gated routes render nothing meaningful in this epic.
- **Settings view contents** — Epic 2 ships the Reset action; the route is empty in this epic.
- **SSE event producers** — Epic 4a publishes real events. `/live/events` emits only heartbeat in this epic.
- **Feature tables** — every feature epic declares its own tables. Data Layer wiring lands here; feature schemas do not.
- **Window-spawning abstraction** — Epic 2's OAuth `BrowserWindow` owns this. Epic 1 opens one primary renderer window.
- **Cross-platform signed installers, release pipeline, auto-update channel** — deferred until all M1–M3 epics ship. Release engineering is a single focused pass once the product surface stabilizes.
- **Auto-update mechanism** — Future Direction. New versions arrive by downloading a new build.
- **Viewer-facing surface, production control, hosted deployment, multi-account-per-install** — rejected at PRD level.

### Assumptions

| ID | Assumption | Status | Notes |
|----|------------|--------|-------|
| A1 | `better-sqlite3` compiles cleanly against Electron's Node ABI on the developer's host OS with `electron-rebuild` or equivalent | Unvalidated | First validation of arch A1; other OSes validated post-M3 when release engineering adds a matrix |
| A2 | Node 24.14.1 (shipped inside Electron 41) runs Fastify 5 without runtime incompatibility | Validated | Arch A8 |
| A3 | Tailwind 4.1 + shadcn/ui render without Electron-specific issues under Chromium 146 | Unvalidated | Arch A5; validated by landing view rendering |
| A4 | SSE over `http://127.0.0.1:7077` works in the Electron renderer and in a standalone browser | Unvalidated | Arch A4; validated by heartbeat reaching client |
| A5 | Twitch accepts `http://localhost:7077/oauth/callback` as a registered redirect URI on the Twitch developer app | Unvalidated | Arch A3, PRD A5; Epic 2 verifies by completing a sign-in |
| A6 | Port 7077 on `127.0.0.1` is available on the developer's host OS without admin privileges | Likely | Common-collision check; developer can override via env var if needed (mechanism is tech-design detail) |

---

## Flows & Requirements

### 1. Launching the App & Landing View

A streamer opens the installed app (or a developer runs `pnpm start`). The primary renderer window opens to the landing view. The landing view describes the product, lists its five capabilities, and presents an active sign-in button.

1. User launches the app (packaged artifact or `pnpm start`)
2. System opens a single renderer window
3. System renders the landing view
4. User reads the description, sees the capability list, and sees the active sign-in button

#### Acceptance Criteria

**AC-1.1:** Launching the app opens exactly one primary renderer window displaying the landing view.

- **TC-1.1a: Packaged build opens to landing**
  - Given: A packaged Electron artifact produced by this epic's build command
  - When: The user launches the artifact
  - Then: Exactly one renderer window opens and the landing view is visible
- **TC-1.1b: Full-app dev mode opens to landing**
  - Given: A freshly cloned repo with `pnpm install` complete
  - When: The developer runs `pnpm start`
  - Then: Exactly one Electron window opens and the landing view is visible

**AC-1.2:** The landing view contains the product name, a one-sentence description, a five-item capability list naming channel management, live moderation, clip creation, custom `!commands`, and welcome bot, and a single sign-in button. Exact copy is implementation-level.

- **TC-1.2a: Landing content inventory**
  - Given: The landing view is rendered
  - When: The view is inspected
  - Then: Product name, one-sentence description, exactly five capability items (channel management, live moderation, clip creation, custom `!commands`, welcome bot in any order), and one sign-in button are all visible

**AC-1.3:** The sign-in button is active (not disabled). Activation (click, keyboard, or assistive-technology action) invokes the auth entry point at `POST /auth/login`. The renderer handles the server response according to its shape: on an OAuth redirect (Epic 2+), follow it; on an error envelope, surface a message keyed to the returned error code. This contract is stable across Epic 1 and Epic 2; the server-side handler changes between them (AC-6.2 defines Epic 1's stub behavior).

- **TC-1.3a: Button is active**
  - Given: The landing view is rendered
  - When: The user inspects the sign-in button
  - Then: The button is active (can be activated by click, keyboard, and screen reader)
- **TC-1.3b: Activation invokes the auth entry point**
  - Given: The landing view is rendered and the server is running
  - When: The user activates the sign-in button
  - Then: The renderer issues `POST /auth/login`
- **TC-1.3c: Renderer handles error-envelope responses**
  - Given: The server responds to `POST /auth/login` with a typed error envelope (Epic 1's stub returns 501 `NOT_IMPLEMENTED` per AC-6.2)
  - When: The renderer receives the response
  - Then: The renderer surfaces a user-visible message keyed to the returned error code

**AC-1.4:** The landing view issues zero HTTP requests to the Fastify server when it loads. The view is fully renderable with the server absent (renderer-only dev mode).

- **TC-1.4a: Landing renders with server absent**
  - Given: Only `pnpm --filter client dev` is running (no Fastify server)
  - When: The developer opens the Vite dev server URL in a browser
  - Then: The landing view renders with AC-1.2 content
- **TC-1.4b: No outbound HTTP on mount**
  - Given: The landing view mounts in a test harness with a recording HTTP mock
  - When: Mount completes
  - Then: Zero requests have been issued to the server

---

### 2. Unauthenticated Route Gating

The streamer (or a local visitor) cannot reach any non-landing surface without a session. The gate runs on both sides: a client-side React Router guard and a server-side Fastify preHandler. The server-side gate operates on a default-gated policy — every HTTP route is gated unless its path appears in a declared exempt-path list. Epic 1's exempt list contains `/oauth/callback` and `/auth/login`.

1. User attempts to navigate to a gated surface directly
2. System checks session state
3. System returns the user to landing (client) or returns 401 (server)

#### Acceptance Criteria

**AC-2.1:** Direct navigation in the renderer to any client-side route other than landing, without an authenticated session, results in the landing view being displayed.

- **TC-2.1a: /home redirects to landing**
  - Given: No session cookie is set
  - When: The user navigates the renderer to `/home`
  - Then: The renderer displays the landing view and the URL reflects landing
- **TC-2.1b: /settings redirects to landing**
  - Given: No session cookie is set
  - When: The user navigates the renderer to `/settings`
  - Then: The renderer displays the landing view and the URL reflects landing
- **TC-2.1c: Unknown gated path redirects to landing**
  - Given: No session cookie is set
  - When: The user navigates the renderer to any arbitrary `/foo` path (not landing)
  - Then: The renderer displays the landing view and the URL reflects landing

**AC-2.2:** HTTP requests to gated server routes without an authenticated session return HTTP 401 with error envelope `{ code: "AUTH_REQUIRED" }`.

- **TC-2.2a: /live/events returns 401 unauthenticated**
  - Given: No session cookie is present
  - When: A GET is made to `/live/events`
  - Then: Response is 401 and body contains `{ error: { code: "AUTH_REQUIRED", message: <non-empty> } }`

**AC-2.3:** Server-side gate operates on a default-gated policy with a declared exempt-path list. The list contains `/oauth/callback` and `/auth/login` in Epic 1. Exempt paths are readable by unit tests.

- **TC-2.3a: Exempt list contents (unit)**
  - Given: The central exempt-path list
  - When: The test reads the list
  - Then: The list contains exactly `/oauth/callback` and `/auth/login`
- **TC-2.3b: /oauth/callback reaches handler unauthenticated**
  - Given: No session cookie
  - When: A GET is made to `/oauth/callback`
  - Then: Response is 501 `NOT_IMPLEMENTED` (not 401) — proving the gate exempted the path
- **TC-2.3c: /auth/login reaches handler unauthenticated**
  - Given: No session cookie
  - When: A POST is made to `/auth/login` with a matching Origin
  - Then: Response is 501 `NOT_IMPLEMENTED` (not 401)

**AC-2.4:** The landing route is reachable without a session on both the client (renderer) and the server (no server-side content for it; landing is not served by Fastify).

- **TC-2.4a: Landing reachable unauthenticated**
  - Given: No session cookie is present
  - When: The user loads the landing route
  - Then: The landing view renders (not a redirect to a different URL, not a 401)

**AC-2.5:** New server-side routes inherit the session gate by default without per-route gate-declaration code. Exempting a route requires adding its path to the exempt-path list. The renderer's client-side routes follow the same default-gated pattern. How route registration centralizes this behavior is a tech-design choice.

- **TC-2.5a: New gated route inherits gate (unit)**
  - Given: A new server route registered without any gate-related code
  - When: A request to that route is made without a session
  - Then: Response is 401 `AUTH_REQUIRED`
- **TC-2.5b: New client route inherits client-side gate (unit)**
  - Given: A new React route registered without gate-related code
  - When: A user navigates to it unauthenticated
  - Then: The user is redirected to landing

**AC-2.6:** The renderer registers `/home` and `/settings` as gated placeholder routes. Neither route renders feature content in Epic 1. Both redirect to landing when unauthenticated per AC-2.1.

- **TC-2.6a: /home and /settings are registered**
  - Given: The renderer's route configuration
  - When: A test reads the registered routes
  - Then: Both `/home` and `/settings` are present and marked gated

**Note on session validation in Epic 1:** Epic 1 does not issue session cookies. The gate is validated by asserting the 401 branch is taken on gated routes and the handler branch is taken on exempt routes. End-to-end validation with a real session lands in Epic 2.

---

### 3. Developer Dev Modes

A contributor clones the repo and chooses one of three launch paths based on what they're working on.

1. Developer clones the repo
2. Developer runs `pnpm install`
3. Developer chooses a mode and runs the matching command

#### Acceptance Criteria

**AC-3.1:** `pnpm start` launches Electron with Fastify + Vite + renderer and boots to the landing view.

- **TC-3.1a: Full-app mode starts**
  - Given: Repo is installed
  - When: The developer runs `pnpm start`
  - Then: An Electron window opens to landing

**AC-3.2:** In full-app mode, renderer source-file changes are reflected in the running renderer without an Electron restart (hot reload).

- **TC-3.2a: Renderer hot reload**
  - Given: Full-app mode is running
  - When: The developer saves a change to a renderer source file
  - Then: The change is visible in the renderer without an Electron restart

**AC-3.3:** `pnpm --filter client dev` serves the renderer alone via Vite on a localhost port. The landing view renders in any modern browser at that URL without requiring Electron, Fastify, or native-module rebuilds.

- **TC-3.3a: Renderer-only mode serves landing**
  - Given: Repo is installed, no Electron invocation, no Fastify running
  - When: The developer runs `pnpm --filter client dev` and opens the reported localhost URL in a browser
  - Then: The landing view renders with AC-1.2 content

**AC-3.4:** `pnpm --filter server dev` runs Fastify standalone on `127.0.0.1:7077`. Registered routes behave per their gated/exempt policies (AC-2.2, AC-2.3, AC-6.1, AC-6.2, AC-6.3).

- **TC-3.4a: /oauth/callback stub responds**
  - Given: Server-only mode is running
  - When: A GET is made to `/oauth/callback`
  - Then: Response is 501 `NOT_IMPLEMENTED`
- **TC-3.4b: /live/events gated**
  - Given: Server-only mode is running, no session cookie
  - When: A client attempts to subscribe to `/live/events`
  - Then: Response is 401 `AUTH_REQUIRED`

**AC-3.5:** All three modes are documented in the repo's README with the command, the use case, and any setup prerequisites.

- **TC-3.5a: Dev-mode documentation exists**
  - Given: A freshly cloned repo
  - When: The developer reads the README
  - Then: All three commands from AC-3.1, AC-3.3, AC-3.4 are listed with brief descriptions

---

### 4. Packaged Build for Developer OS

The developer produces an Electron-packaged artifact on their host OS that runs as a standalone desktop app. Cross-OS installers and code signing are deferred post-M3 per scope.

#### Acceptance Criteria

**AC-4.1:** A single `pnpm` command produces an Electron-packaged artifact appropriate for the developer's host OS in a repo-local output directory. The command name is a tech-design choice; the behavior is fixed.

- **TC-4.1a: Packaging command produces an artifact**
  - Given: Repo is installed on the developer's host OS
  - When: The developer runs the packaging command
  - Then: A host-OS-appropriate Electron artifact (e.g., `.exe` on Windows, `.app` on macOS, `.AppImage` or `.deb` on Linux) is present in the output directory

**AC-4.2:** The packaged artifact launches and opens to the landing view per AC-1.1.

- **TC-4.2a: Packaged artifact boots to landing**
  - Given: A packaged artifact from AC-4.1
  - When: The user launches it outside of `pnpm start`
  - Then: A renderer window opens to the landing view

**AC-4.3:** The packaging command is documented in the README alongside the dev-mode commands.

- **TC-4.3a: Packaging documented**
  - Given: The README lists dev modes
  - When: The developer scans for the packaging command
  - Then: The command is present with a note that it targets the host OS only

---

### 5. Continuous Integration

Every pull request against `main` runs lint, typecheck, and unit tests on Ubuntu Linux. Failures are visible on the PR.

#### Acceptance Criteria

**AC-5.1:** A GitHub Actions workflow triggers on every `pull_request` event against `main` and runs on Ubuntu Linux. Workflow file path and runner image version are tech-design choices.

- **TC-5.1a: Workflow triggers on PR and runs on Ubuntu**
  - Given: A pull request is opened against `main`
  - When: GitHub receives the PR event
  - Then: A CI workflow begins running within GitHub Actions' normal queueing latency, on a Linux runner

**AC-5.2:** The CI workflow runs lint (Biome), typecheck (TypeScript), and unit tests (Vitest).

- **TC-5.2a: Lint step runs**
  - Given: A PR with a lint violation in any workspace package
  - When: CI runs
  - Then: The lint step fails and the workflow is marked failed
- **TC-5.2b: Typecheck step runs**
  - Given: A PR with a TypeScript error in any workspace package
  - When: CI runs
  - Then: The typecheck step fails and the workflow is marked failed
- **TC-5.2c: Unit test step runs**
  - Given: A PR with a failing unit test
  - When: CI runs
  - Then: The unit test step fails and the workflow is marked failed
- **TC-5.2d: Green PR produces green CI**
  - Given: A PR with no lint, typecheck, or unit-test violations
  - When: CI runs
  - Then: All three steps pass and the workflow is marked successful

**AC-5.3:** CI does not build packaged installers, publish releases, or run on a cross-OS matrix. This is enforced by the workflow's declared `runs-on` and absence of release-publishing actions.

- **TC-5.3a: Workflow has no release-publish steps**
  - Given: A CI workflow run against a representative PR
  - When: The run completes
  - Then: No step executed a packaging command, no step invoked a release-publishing action, and the run executed on a single Linux runner

**AC-5.4:** The CI workflow runs the same `pnpm` scripts a developer runs locally.

- **TC-5.4a: CI commands match local scripts**
  - Given: A CI workflow run against a representative PR
  - When: The run completes
  - Then: Every command the workflow executed is a `pnpm` script defined in the repo

**AC-5.5:** CI is a pre-verification gate. A pull request cannot be merged to `main` until the CI workflow has completed successfully on the PR branch. The workflow does not run on push events to `main`. The enforcement mechanism (branch protection, required check, merge queue, or equivalent) is a tech-design choice.

- **TC-5.5a: Failing CI blocks merge**
  - Given: A PR with a failing CI run
  - When: A maintainer attempts to merge the PR
  - Then: The merge is blocked until CI passes
- **TC-5.5b: CI does not run on main push**
  - Given: A commit is pushed directly to `main`
  - When: GitHub receives the push event
  - Then: No CI workflow run is triggered by the push event

---

### 6. Stub Endpoints

Three HTTP endpoints register in this epic without their full behavior. `/oauth/callback` reserves the path Twitch will redirect to in Epic 2. `/auth/login` is called by the active sign-in button and returns a typed `NOT_IMPLEMENTED` error that the renderer surfaces. `/live/events` emits heartbeat SSE so Epic 4a can wire real producers onto an already-working transport.

#### Acceptance Criteria

**AC-6.1:** `GET /oauth/callback` is registered on the exempt-path list and returns HTTP 501 with `{ code: "NOT_IMPLEMENTED" }`.

- **TC-6.1a: Callback returns 501**
  - Given: The server is running
  - When: A GET is made to `/oauth/callback`
  - Then: Response is 501 and body contains `{ error: { code: "NOT_IMPLEMENTED", message: <non-empty> } }`

**AC-6.2:** `POST /auth/login` is registered on the exempt-path list, subject to Origin validation, and returns HTTP 501 with `{ code: "NOT_IMPLEMENTED" }`. Epic 2 replaces the handler body; the route registration does not change.

- **TC-6.2a: Login stub returns 501 with matching Origin**
  - Given: The server is running
  - When: A POST is made to `/auth/login` with an Origin in the configured allowed set
  - Then: Response is 501 and body contains `{ error: { code: "NOT_IMPLEMENTED", message: <non-empty> } }`
- **TC-6.2b: Login stub rejects on Origin mismatch**
  - Given: The server is running
  - When: A POST is made to `/auth/login` with an Origin not in the configured allowed set
  - Then: Response is 403 `ORIGIN_REJECTED` (proving Origin check runs on exempt-path state-changing routes)

**AC-6.3:** `GET /live/events` is an SSE endpoint registered behind the server-side session gate. While an authenticated subscriber is connected, the endpoint emits a `heartbeat` event at least once every 30 seconds.

- **TC-6.3a: Heartbeat cadence (unit, simulated time)**
  - Given: A mocked authenticated session attached to the handler, with test time advancement
  - When: The test advances simulated time by 30 seconds after a subscriber connects
  - Then: At least one `heartbeat` event has been emitted
- **TC-6.3b: Unauthenticated subscribe rejected**
  - Given: No session cookie
  - When: A client attempts to subscribe to `/live/events`
  - Then: Response is 401 `AUTH_REQUIRED`

**AC-6.4:** SSE events conform to a typed envelope defined in the shared package. `heartbeat` is the first registered event type; its payload is an empty object in Epic 1.

- **TC-6.4a: Heartbeat event shape**
  - Given: An emitted heartbeat event
  - When: The event payload is parsed against the shared SSE event schema
  - Then: Parsing succeeds, the event type is `heartbeat`, and the data payload is an empty object

---

### 7. Localhost Trust Boundary

The Fastify server binds to `127.0.0.1:7077` — loopback only, never `0.0.0.0`. State-changing HTTP routes (including exempt routes like `/auth/login`) reject requests whose `Origin` header is not in a configured allowed set.

#### Acceptance Criteria

**AC-7.1:** Fastify binds to `127.0.0.1:7077`. Binding to `0.0.0.0` or any non-loopback address is a defect.

- **TC-7.1a: Server binds to 127.0.0.1:7077**
  - Given: The server starts in any dev mode
  - When: A test reads the bound address and port
  - Then: The bound address is `127.0.0.1` and the bound port is `7077`

**AC-7.2:** A preHandler validates the `Origin` header on every state-changing HTTP route (POST, PATCH, PUT, DELETE), including exempt-path state-changing routes. Requests with an Origin not in the configured allowed set are rejected with HTTP 403 and `{ code: "ORIGIN_REJECTED" }`. The allowed set is configuration data; its values are resolved at tech design.

- **TC-7.2a: Mismatched Origin rejected on state-changing route**
  - Given: The server is running
  - When: A POST to `/auth/login` sends an Origin not in the allowed set
  - Then: Response is 403 with `{ error: { code: "ORIGIN_REJECTED", message: <non-empty> } }`
- **TC-7.2b: Missing Origin rejected on state-changing route**
  - Given: The server is running
  - When: A POST to `/auth/login` omits the Origin header
  - Then: Response is 403 `ORIGIN_REJECTED`

**AC-7.3:** GET requests to exempt paths (only `/oauth/callback` in Epic 1 — `/auth/login` is POST and subject to AC-7.2) pass without Origin validation. Whether GETs to gated data routes require Origin validation is a tech-design choice. The landing view is not served by Fastify and therefore does not reach this preHandler.

- **TC-7.3a: GET /oauth/callback passes without Origin**
  - Given: The server is running
  - When: A GET to `/oauth/callback` omits the Origin header
  - Then: Response is 501 `NOT_IMPLEMENTED` (not 403)

**AC-7.4:** On state-changing routes, the Origin preHandler runs before the session gate. Origin rejection happens before the session check.

- **TC-7.4a: Origin rejected before session check**
  - Given: No session cookie and a mismatched Origin
  - When: A POST is made to any state-changing gated route
  - Then: Response is 403 `ORIGIN_REJECTED` (not 401 `AUTH_REQUIRED`)

---

### 8. Typed Error Envelope

Every error leaving the server carries a stable machine-readable code in a consistent envelope. The renderer switches on the code, not the message. The registry is append-only by convention: once a code ships, it never changes meaning. Enforcement is by review discipline; tech design may choose to document the rule in a source comment or contribution guide.

#### Acceptance Criteria

**AC-8.1:** All non-2xx responses from registered HTTP routes use envelope `{ error: { code: <string>, message: <string> } }`.

- **TC-8.1a: 401 envelope shape**
  - Given: A gated route hit without session
  - When: The response arrives
  - Then: Body parses as `{ error: { code: "AUTH_REQUIRED", message: <non-empty> } }`
- **TC-8.1b: 403 envelope shape**
  - Given: A state-changing route hit with mismatched Origin
  - When: The response arrives
  - Then: Body parses as `{ error: { code: "ORIGIN_REJECTED", message: <non-empty> } }`
- **TC-8.1c: 501 envelope shape**
  - Given: `/oauth/callback` is hit in Epic 1
  - When: The response arrives
  - Then: Body parses as `{ error: { code: "NOT_IMPLEMENTED", message: <non-empty> } }`
- **TC-8.1d: 500 catch-all envelope**
  - Given: A route handler throws an unhandled error
  - When: The server serializes the response
  - Then: Body parses as `{ error: { code: "SERVER_ERROR", message: <non-empty> } }` and no stack trace leaks into `message`

**AC-8.2:** A single central error handler on the Fastify instance (registered via `setErrorHandler` or equivalent) serializes every thrown error into the envelope. Route handlers do not serialize errors directly.

- **TC-8.2a: Central error handler catches thrown errors**
  - Given: A test-only route registered through the central registration function that throws an unhandled error
  - When: A request hits that route
  - Then: Response is 500 with `{ error: { code: "SERVER_ERROR", message: <non-empty> } }` — produced by the central handler, not the route

**AC-8.3:** The error-code registry in the shared package includes at least: `AUTH_REQUIRED`, `ORIGIN_REJECTED`, `NOT_IMPLEMENTED`, `SERVER_ERROR`, `INPUT_INVALID`.

- **TC-8.3a: Registry contains starter set (unit)**
  - Given: The shared-package error registry export
  - When: A unit test reads the registered codes
  - Then: All five codes are present

---

### 9. Install-Local Persistence Bootstrap

The Data Layer domain's plumbing lands here so Epic 2 can add the first real table (tokens, binding) without redeciding how persistence works. SQLite file location, migration runner, `better-sqlite3` build, and one baseline migration are in scope. Feature tables are not.

1. App starts
2. Data Layer resolves the OS userData path
3. Data Layer opens or creates the SQLite file
4. Migration runner applies unapplied migrations
5. Server begins accepting requests

#### Acceptance Criteria

**AC-9.1:** On first launch, a SQLite file is created at the OS's userData path under a known filename. On subsequent launches, the existing file is opened.

- **TC-9.1a: First launch creates file**
  - Given: No existing userData directory for this app
  - When: The full app boots
  - Then: A SQLite file exists at `<userData>/<known-filename>`
- **TC-9.1b: Second launch reuses file (sentinel row)**
  - Given: The first launch has completed and the test writes a sentinel row into a test-only table created by the baseline migration
  - When: The app is stopped and relaunched
  - Then: The sentinel row is readable from the same SQLite file

**AC-9.2:** The Drizzle migration runner is wired into server bootstrap and runs all unapplied migrations before the server begins accepting requests.

- **TC-9.2a: Migrations run before HTTP served**
  - Given: A fresh SQLite file
  - When: The server starts
  - Then: All baseline migrations are applied before the first HTTP request is served
- **TC-9.2b: Migrations are idempotent**
  - Given: A SQLite file with all migrations already applied
  - When: The server restarts
  - Then: The migration runner completes without error and without re-applying migrations

**AC-9.3:** `better-sqlite3` compiles cleanly against Electron's Node ABI on the developer's host OS. This validates arch A1 for that OS.

- **TC-9.3a: Native-module rebuild succeeds**
  - Given: A freshly-installed repo on the developer's host OS
  - When: The install step completes (including any `electron-rebuild` invocation)
  - Then: `pnpm start` opens the SQLite file without a native-module error

**AC-9.4:** Exactly one baseline migration exists. No feature-specific tables (no tokens, no install binding, no commands, no chatters, no welcome state, no recent clips) exist in the Epic 1 schema. Baseline migration content is a tech-design choice.

- **TC-9.4a: Exactly one baseline migration applied**
  - Given: A fresh SQLite file after server bootstrap
  - When: The test reads the applied-migrations record
  - Then: Exactly one baseline migration is recorded
- **TC-9.4b: No feature tables present**
  - Given: The Epic 1 schema on disk
  - When: The test lists tables
  - Then: No table with a feature-specific name (`tokens`, `install_binding`, `commands`, `chatters`, `welcome_state`, `recent_clips`) exists

---

## Data Contracts

### HTTP Routes Registered in Epic 1

| Operation | Method | Path | Gated? | Origin-check? | Response |
|-----------|--------|------|--------|---------------|----------|
| Sign-in stub | POST | `/auth/login` | Exempt | Yes | 501 `NOT_IMPLEMENTED` |
| OAuth callback stub | GET | `/oauth/callback` | Exempt | No (GET) | 501 `NOT_IMPLEMENTED` |
| Live events SSE | GET | `/live/events` | Yes | No (GET) | SSE stream (heartbeat only) |

The landing view is not served by Fastify. It is rendered by the React renderer, which is loaded by Vite in dev and by Electron in production.

Client-side renderer routes registered in Epic 1:

| Client Route | Gated? | Content |
|--------------|--------|---------|
| `/` (landing) | No | Full landing view per AC-1.2 |
| `/home` | Yes | Empty placeholder |
| `/settings` | Yes | Empty placeholder |

### Error Envelope

Every non-2xx response from a server route carries this body:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `error.code` | string | yes | Matches a registered code | Machine-readable error code |
| `error.message` | string | yes | Non-empty | Human-readable explanation |

### Error-Code Registry (Epic 1 Starter Set)

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTH_REQUIRED` | 401 | Request lacks an authenticated session |
| `ORIGIN_REJECTED` | 403 | Request's `Origin` header is not in the allowed set |
| `NOT_IMPLEMENTED` | 501 | Route registered; behavior pending a later epic |
| `SERVER_ERROR` | 500 | Unexpected unhandled server error |
| `INPUT_INVALID` | 400 | Request body or parameters failed validation |

Registry is append-only by convention. Later epics add codes; no epic changes an existing code's meaning.

### SSE Event Envelope

Every event sent over `/live/events`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Event type (Epic 1: `heartbeat`) |
| `data` | object | yes | Event-type-specific payload (Epic 1 `heartbeat` payload: `{}`) |

Heartbeat cadence: at least one event every 30 seconds while a subscriber is connected.

### Server Binding

| Property | Value |
|----------|-------|
| Address | `127.0.0.1` (loopback only) |
| Port | `7077` |
| Allowed Origin set | Configuration; values resolved at tech design (must cover Vite dev origin, Electron-hosted production origin) |

---

## Dependencies

**Technical dependencies (settled in architecture):**

- Node.js 24 LTS (inside Electron 41)
- Electron 41
- Fastify 5 with `@fastify/type-provider-zod`
- React 19 + Vite 8
- Tailwind 4.1 + shadcn/ui
- SQLite via `better-sqlite3` + Drizzle ORM 0.45.x
- Zod 4
- Vitest 4
- Biome 2
- pnpm 10
- iron-session (introduced by Epic 2 when session cookies are first issued)

**Process dependencies:**

- Twitch developer application registered with redirect URI `http://localhost:7077/oauth/callback`. Epic 1 does not call Twitch; Epic 2 blocks on this.
- GitHub repository with Actions enabled on `main`.

**No dependency on any other epic.**

---

## Non-Functional Requirements

**Startup latency (targets, not ACs):**
- Packaged build cold start to landing-visible: under 5 seconds on a typical developer machine.
- `pnpm start` cold start to landing-visible: under 10 seconds on a typical developer machine.
- Renderer-only mode cold start: under 3 seconds.

**Reliability:**
- A fresh clone + `pnpm install` + `pnpm start` succeeds on the developer's host OS following documented README steps.
- CI runs are deterministic: outcomes depend only on committed code (no network, no external state).

**Security:**
- No secrets persist in Epic 1.
- Origin validation rejects before the session check on state-changing routes (AC-7.4).
- Session cookies (first issued in Epic 2) carry `HttpOnly` and `SameSite=Strict`; cookie configuration and its verification land with Epic 2.
- Fastify binds to `127.0.0.1` — not `0.0.0.0` — preventing LAN exposure (AC-7.1).

**Observability:**
- Server logs startup events (bound address/port, migrations applied, routes registered) to stdout.
- Origin rejections and 5xx server errors log route, method, and code. No session cookies, Authorization headers, or request bodies are logged.

**Accessibility:**
- Landing view is keyboard-navigable. The sign-in button's active state is announced by assistive technology (AC-1.3a).

---

## Tech Design Questions

1. **Electron packaging tool.** `electron-builder` vs `electron-forge` vs `electron-vite`. Affects config format and installer output.
2. **Renderer state model.** React Context + `useSyncExternalStore` vs pub/sub vs Zustand vs TanStack Query. Needed before Epic 4a; the choice lands here.
3. **Error-code registry shape.** Discriminated union vs string enum vs typed const map.
4. **Allowed-origin set values.** Vite dev origin + Electron-hosted production origin. Tech design resolves both strings and the per-environment resolution mechanism.
5. **Electron window chrome.** Native vs frameless. Pure presentation.
6. **Baseline migration content.** Empty migration recording a schema-version row vs minimal `install_metadata` table vs equivalent.
7. **`pnpm` script names.** Root and per-workspace scripts (`start`, `dev`, `build`, `package`, `lint`, `typecheck`, `test`). Names must match between local and CI.
8. **SSE heartbeat exact interval.** AC-6.3 allows "at least once every 30 seconds"; tech design picks the exact value.
9. **Electron native-module rebuild integration.** `electron-rebuild` via post-install hook vs packaging-tool built-in.
10. **CI caching and concurrency.** pnpm store cache, Node version pin, job parallelism.
11. **Cookie-options module API.** How iron-session + `@fastify/cookie` configure session cookies — deferred to Epic 2 tech design where cookies first ship.
12. **Port override mechanism.** Environment variable name and precedence for overriding the default 7077.
13. **Client-side route registration pattern.** How a new React route declares gated vs public (AC-2.5b).

---

## Recommended Story Breakdown

Story 0 delivers foundation. Stories 1–9 ship vertical slices. Each story declares what it **Delivers** (ACs it completes) and, where applicable, what it **Prepares** (ACs a later story will complete using infrastructure this story lands).

### Story 0: Monorepo + Tooling Foundation

**Delivers:** pnpm workspace with `apps/panel/{server, client, shared}` layout; Biome, TypeScript, Vitest configured; empty `AppError` + registry scaffolding.

**Prerequisite:** None.

**ACs delivered:** AC-8.3 (error-code registry populated with the starter set).

**Prepares:** AC-8.1 (envelope type lands; individual status-code envelopes delivered by Stories 1, 2, 4 as each code first fires).

---

### Story 1: Fastify Server + Central Route Wiring

**Delivers:** Fastify on `127.0.0.1:7077` via a single central route registration function; central error handler; health-check route to prove the server boots.

**Prerequisite:** Story 0.

**ACs delivered:** AC-7.1, AC-8.1d, AC-8.2.

**Prepares:** AC-2.5a (central registration is the shape later gate code will install against); AC-3.4 (server-only mode runs here; route-policy behavior closes in Story 4).

---

### Story 2: Stub Endpoints

**Delivers:** `/oauth/callback` handler (AC-6.1); `/auth/login` handler body returning 501 (route registration only — Origin check and its TCs land in Story 4); `/live/events` heartbeat handler (cadence proven here; auth rejection lands in Story 4); shared SSE envelope (AC-6.4).

**Prerequisite:** Story 1.

**ACs delivered:** AC-6.1, AC-6.4, AC-8.1c; AC-6.3 partial (heartbeat cadence per TC-6.3a).

**Prepares:** AC-6.2 (Origin-checked behavior closes in Story 4); AC-6.3b (unauthenticated rejection closes in Story 4).

---

### Story 3: Data Layer Bootstrap

**Delivers:** SQLite file at userData path; `better-sqlite3` rebuild; Drizzle migration runner; one baseline migration.

**Prerequisite:** Story 1.

**ACs delivered:** AC-9.1, AC-9.2, AC-9.3, AC-9.4.

---

### Story 4: Server-Side Gate + Origin Validation + Cookie Defaults

**Delivers:** Default-gated preHandler with exempt list (`/oauth/callback`, `/auth/login`); Origin validation on state-changing routes.

**Prerequisite:** Story 2.

**ACs delivered:** AC-2.2, AC-2.3, AC-2.5a, AC-3.4 (server-only mode's route-policy behavior now observable end-to-end), AC-6.2, AC-6.3 full (auth-rejection TC-6.3b closes), AC-7.2, AC-7.3, AC-7.4, AC-8.1a, AC-8.1b.

---

### Story 5: React Renderer + Landing View

**Delivers:** React 19 + Vite 8 + Tailwind 4.1 + shadcn/ui; landing view content; active sign-in button wired to `POST /auth/login`; renderer-only dev mode.

**Prerequisite:** Story 0.

**ACs delivered:** AC-1.2, AC-1.3, AC-1.4, AC-3.3.

---

### Story 6: Client-Side Router + Gating + Placeholder Routes

**Delivers:** React Router; client-side gate guarding non-landing routes; empty `/home` and `/settings` routes; redirect-to-landing behavior.

**Prerequisite:** Story 5.

**ACs delivered:** AC-2.1, AC-2.4, AC-2.5b, AC-2.6.

---

### Story 7: Electron Main Process + Full-App Mode

**Delivers:** Electron 41 hosting Fastify + renderer in one process tree; `pnpm start` end-to-end; hot reload.

**Prerequisite:** Stories 4, 6.

**ACs delivered:** AC-1.1, AC-3.1, AC-3.2, AC-3.5.

---

### Story 8: Packaged Build for Developer OS

**Delivers:** Chosen Electron packaging tool wired into a `pnpm` command; artifact for host OS; packaged build launches to landing.

**Prerequisite:** Story 7.

**ACs delivered:** AC-4.1, AC-4.2, AC-4.3.

---

### Story 9: CI Workflow

**Delivers:** CI workflow on Ubuntu Linux triggered by `pull_request` events; lint/typecheck/test steps; pre-verification merge gate; observed-run tests for configuration and script parity.

**Prerequisite:** Story 0.

**ACs delivered:** AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5.

**Ordering note:** Can run in parallel with Stories 1–8 after Story 0's scripts are in place. Often landed early so every subsequent PR runs through CI.

---

## Validation Checklist

- [x] User Profile has all four fields + Feature Overview
- [x] Flows cover all paths including error/unauthenticated cases
- [x] Every AC is testable (no vague terms)
- [x] Every AC has at least one TC
- [x] TCs cover happy path, edge cases, and error paths
- [x] Data contracts specified at HTTP, error, and SSE boundaries
- [x] Scope boundaries explicit (In / Out / Assumptions), including deliberate PRD override noted at the top
- [x] Story breakdown covers all ACs; Delivers/Prepares distinction clear
- [x] Stories sequence logically
- [x] Review findings from Claude and Codex incorporated (Writing style, testability, altitude-override documented, hypothetical routes replaced with concrete `/auth/login`, shared package aligned to arch)
- [ ] Tech Lead feasibility feedback (pending tech-design phase)
