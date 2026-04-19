# Story 1: Fastify Server + Central Route Wiring

### Summary
<!-- Jira: Summary field -->

Stand up Fastify 5 on `127.0.0.1:7077`, install the central route registrar and central error handler, and wire a stub session preHandler so later stories inherit the gate shape.

### Description
<!-- Jira: Description field -->

**User Profile:** Developer.

**Objective:** Deliver the Fastify bootstrap that every server route will register through. Fastify binds loopback-only on the fixed port; `registerRoute(app, spec)` composes Origin + session preHandlers automatically from a declarative spec; `setErrorHandler` serializes every thrown error into the typed envelope. A stub `sessionPreHandler` is installed here that unconditionally throws `AUTH_REQUIRED` so TC-2.5a (new route inherits the gate) is testable in this story; Story 4 replaces the stub body with the real iron-session implementation.

**Scope — In:**
- `apps/panel/server/src/server/buildServer.ts` — Fastify factory returning `{ app, db, config }`; `startServer()` helper that calls `listen({ host: '127.0.0.1', port: 7077 })`
- `apps/panel/server/src/server/config.ts` — `PANEL_PORT = 7077`, `PANEL_HOST = '127.0.0.1'` constants; `loadConfig()` resolves port, host, userData DB path, allowed origins, cookie secret
- `apps/panel/server/src/server/registerRoute.ts` — central registrar composing preHandlers `[origin?, session?, ...custom]`; safety check rejects `exempt: true` for paths not in `GATE_EXEMPT_PATHS`
- `apps/panel/server/src/server/errorHandler.ts` — `registerErrorHandler(app)` installs `setErrorHandler` that maps `AppError` → typed envelope, Zod validation errors → `INPUT_INVALID`, unknown errors → `SERVER_ERROR` (no stack leak)
- `apps/panel/server/src/gate/sessionPreHandler.ts` — **stub** that throws `AppError('AUTH_REQUIRED', 'stub: real session gate lands in Story 4')`; Story 4 replaces the body without changing the signature or module path
- `apps/panel/server/src/gate/originPreHandler.ts` — **stub** that is a no-op pass-through; Story 4 replaces the body with Origin validation
- `apps/panel/server/src/test/buildTestServer.ts` — test factory invoking `buildServer({ inMemoryDb: true })` with test-safe config overrides
- Zod type provider wired (`@fastify/type-provider-zod`)

**Scope — Out:**
- Real Origin validation logic — Story 4
- Real iron-session validation — Story 4
- Cookie plugin registration (`@fastify/cookie`) — Story 4
- Route handlers for `/auth/login`, `/oauth/callback`, `/live/events` — Story 2
- SQLite `openDatabase` / migrations — Story 3 (the `buildServer` call site threads through the parameter; the implementation body lives in Story 3)

**Dependencies:** Story 0.

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

**AC-7.1:** Fastify binds to `127.0.0.1:7077`. Binding to `0.0.0.0` or any non-loopback address is a defect.

- **TC-7.1a: Server binds to 127.0.0.1:7077**
  - Given: The server starts in any dev mode
  - When: A test reads the bound address and port
  - Then: The bound address is `127.0.0.1` and the bound port is `7077`
  - *Story 1 note:* Asserted via resolved config (`config.host === '127.0.0.1'`, `config.port === 7077`) and via spy on `fastify.listen` receiving those values. Actually binding the port during CI is brittle; the end-to-end bind is exercised in Story 7's observed-run of `pnpm start`.

**AC-8.1 (part — TC-8.1d only):** All non-2xx responses from registered HTTP routes use envelope `{ error: { code: <string>, message: <string> } }`. This story delivers only the 500 catch-all case; 401/403/501 envelope shapes close in Stories 2 and 4.

- **TC-8.1d: 500 catch-all envelope**
  - Given: A route handler throws an unhandled error
  - When: The server serializes the response
  - Then: Body parses as `{ error: { code: "SERVER_ERROR", message: <non-empty> } }` and no stack trace leaks into `message`

**AC-8.2:** A single central error handler on the Fastify instance (registered via `setErrorHandler` or equivalent) serializes every thrown error into the envelope. Route handlers do not serialize errors directly.

- **TC-8.2a: Central error handler catches thrown errors**
  - Given: A test-only route registered through the central registration function that throws an unhandled error
  - When: A request hits that route
  - Then: Response is 500 with `{ error: { code: "SERVER_ERROR", message: <non-empty> } }` — produced by the central handler, not the route

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**Server binding:**

| Property | Value |
|----------|-------|
| Address | `127.0.0.1` (loopback only) |
| Port | `7077` (constant; override deferred per tech-design Open Question Q1) |

**`registerRoute(app, spec)` preHandler composition:**

| Case | preHandler chain |
|------|------------------|
| GET, exempt | `[]` (no Origin check on GET; no session gate for exempt) |
| GET, gated | `[sessionPreHandler]` |
| POST/PUT/PATCH/DELETE, exempt | `[originPreHandler]` (Origin check still applies to state-changing exempt routes) |
| POST/PUT/PATCH/DELETE, gated | `[originPreHandler, sessionPreHandler]` (Origin runs first — AC-7.4) |

Safety check: `exempt: true` fails registration if `spec.url` is not in `GATE_EXEMPT_PATHS` (from `@panel/shared`).

**Central error handler behavior:**

| Thrown error type | Response |
|-------------------|----------|
| `AppError` (any registered code) | `status: error.status`, body `{ error: { code: error.code, message: error.message } }` |
| Fastify/Zod validation error (`error.validation` set) | `400` with `{ error: { code: 'INPUT_INVALID', message: 'Request validation failed.' } }` |
| Any other thrown error | `500` with `{ error: { code: 'SERVER_ERROR', message: <default> } }`; logs at `error` level; no stack in `message` |

**Test files for this story:**
- `server/src/server/buildServer.test.ts` — 2 tests (TC-7.1a + `app.listen` arguments)
- `server/src/server/registerRoute.test.ts` — 3 tests (stub-gate inheritance + `exempt` safety check + state-changing exempt runs Origin)
- `server/src/server/errorHandler.test.ts` — 3 tests (TC-8.1d, TC-8.2a, `INPUT_INVALID` envelope from Zod)

**TC-2.5a coverage note:** TC-2.5a (new server route inherits gate) is assigned to Story 4 in the coverage gate per the epic's Story Breakdown — Story 4 is where AC-2.5a is functionally delivered against the real session preHandler. Story 1's `registerRoute.test.ts` includes a stub-gate inheritance check that exercises the same code path and happens to yield the same 401 outcome (Story 1's stub always throws `AUTH_REQUIRED`). That test is Story 1's infrastructure validation, not Story 4's TC-2.5a assertion; the same test file continues green in Story 4 once the stub is replaced.

See [`../tech-design.md`](../tech-design.md) and [`../tech-design-server.md`](../tech-design-server.md) §Fastify Bootstrap, §Central Registrar, §Server Binding, §Error Model, §Session Gate (staged delivery) for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] `buildServer()` factory returns `{ app, db, config }`; `startServer()` invokes `listen` with resolved config
- [ ] `registerRoute(app, spec)` composes preHandlers per the table above; rejects invalid `exempt: true` at registration time
- [ ] `registerErrorHandler(app)` maps `AppError` / Zod / unknown errors per the table above
- [ ] Stub `sessionPreHandler` throws `AUTH_REQUIRED`; stub `originPreHandler` is a pass-through
- [ ] `buildTestServer()` helper exposes `{ inMemoryDb: true }` + safe config overrides
- [ ] 8 tests pass (2 `buildServer` + 3 `registerRoute` + 3 `errorHandler`)
- [ ] `pnpm verify` passes
- [ ] No stack text leaks into `error.message` for `SERVER_ERROR` responses (assert with a substring check for the thrown error message)
