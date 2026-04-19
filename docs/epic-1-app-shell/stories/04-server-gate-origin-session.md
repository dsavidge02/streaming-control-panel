# Story 4: Server-Side Gate + Origin Validation + Session Cookie Defaults

### Summary
<!-- Jira: Summary field -->

Replace Story 1's stub gate and Origin preHandlers with the real iron-session-backed gate and real Origin allow-set validation; un-skip every test authored against these in Story 2.

### Description
<!-- Jira: Description field -->

**User Profile:** Developer. This story is the first that establishes the real trust boundary of the server.

**Objective:** Deliver the default-gated policy and Origin validation. The exempt-path list lives in `@panel/shared` and contains exactly `/auth/login` and `/oauth/callback`. Origin validation runs on every state-changing route (including exempt state-changing routes like `POST /auth/login`) and runs *before* the session gate. iron-session 8 + `@fastify/cookie` 11 are installed and wired; no route in Epic 1 actually issues a cookie (that is Epic 2), but the 401 branch is exercised end-to-end and a `sealFixtureSession()` test helper is installed so Epic 2's first positive-path test doesn't have to invent it.

**Scope — In:**
- Consume `GATE_EXEMPT_PATHS` from `@panel/shared` (defined and populated in Story 0) — no changes to the constant itself; Story 4 adds its test (TC-2.3a) and wires the session preHandler to consult it
- `apps/panel/server/src/gate/originPreHandler.ts` — **real implementation**: reads `req.headers.origin`, checks against `req.server.config.allowedOrigins`; throws `AppError('ORIGIN_REJECTED', ...)` on missing or non-allowed Origin
- `apps/panel/server/src/gate/sessionPreHandler.ts` — **real implementation**: reads `panel_session` cookie, calls `unsealData` from iron-session with `config.cookieSecret`; attaches `session` to request on success, throws `AppError('AUTH_REQUIRED', ...)` on missing/invalid/expired cookie
- `buildServer` registers `@fastify/cookie` with the configured secret before any route
- `config.ts` exports `resolveAllowedOrigins()` returning `['http://localhost:5173', 'http://127.0.0.1:5173', 'app://panel']`; exports `resolveCookieSecret()` with a deterministic dev default and `PANEL_COOKIE_SECRET` env override
- `apps/panel/server/src/test/sealFixtureSession.ts` — test helper that calls iron-session `sealData` with a default test password and broadcasterId
- `.red-ref` mechanism established: Story 4's Red commit writes `.red-ref`; subsequent Green commits run `guard:no-test-changes`
- Un-skip every `test.skip` added in Story 2 (`auth.test.ts`, `oauthCallback.test.ts`, `liveEvents.test.ts`) — the stubbed paths now go live
- Fastify `decorate('config', config)` so preHandlers can read `req.server.config`

**Scope — Out:**
- Actually issuing a session cookie — Epic 2 (when Twitch OAuth completes and the broadcaster binds)
- Real broadcaster-specific behavior in the session payload
- Cookie rotation, TTL policy — Epic 2

**Dependencies:** Story 1 (registrar, stubs to replace), Story 2 (routes and their skipped tests).

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

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

**AC-2.5 (server side — TC-2.5a):** New server-side routes inherit the session gate by default without per-route gate-declaration code. Exempting a route requires adding its path to the exempt-path list.

- **TC-2.5a: New gated route inherits gate (unit)**
  - Given: A new server route registered without any gate-related code
  - When: A request to that route is made without a session
  - Then: Response is 401 `AUTH_REQUIRED`

**AC-3.4 (completion):** `pnpm --filter server dev` runs Fastify standalone on `127.0.0.1:7077`. Registered routes behave per their gated/exempt policies.

- **TC-3.4b: /live/events gated**
  - Given: Server-only mode is running, no session cookie
  - When: A client attempts to subscribe to `/live/events`
  - Then: Response is 401 `AUTH_REQUIRED`

*TC-3.4a was delivered in Story 2; this story closes TC-3.4b now that the real session gate is active.*

**AC-6.2:** `POST /auth/login` is registered on the exempt-path list, subject to Origin validation, and returns HTTP 501 with `{ code: "NOT_IMPLEMENTED" }`. Epic 2 replaces the handler body; the route registration does not change.

- **TC-6.2a: Login stub returns 501 with matching Origin**
  - Given: The server is running
  - When: A POST is made to `/auth/login` with an Origin in the configured allowed set
  - Then: Response is 501 and body contains `{ error: { code: "NOT_IMPLEMENTED", message: <non-empty> } }`
- **TC-6.2b: Login stub rejects on Origin mismatch**
  - Given: The server is running
  - When: A POST is made to `/auth/login` with an Origin not in the configured allowed set
  - Then: Response is 403 `ORIGIN_REJECTED` (proving Origin check runs on exempt-path state-changing routes)

**AC-6.3 (completion — TC-6.3b):** Unauthenticated subscribers to `/live/events` are rejected.

- **TC-6.3b: Unauthenticated subscribe rejected**
  - Given: No session cookie
  - When: A client attempts to subscribe to `/live/events`
  - Then: Response is 401 `AUTH_REQUIRED`

*TC-6.3a was authored in Story 2 with `test.skip`; this story un-skips it now that `sealFixtureSession()` is available.*

**AC-7.2:** A preHandler validates the `Origin` header on every state-changing HTTP route (POST, PATCH, PUT, DELETE), including exempt-path state-changing routes. Requests with an Origin not in the configured allowed set are rejected with HTTP 403 and `{ code: "ORIGIN_REJECTED" }`.

- **TC-7.2a: Mismatched Origin rejected on state-changing route**
  - Given: The server is running
  - When: A POST to `/auth/login` sends an Origin not in the allowed set
  - Then: Response is 403 with `{ error: { code: "ORIGIN_REJECTED", message: <non-empty> } }`
- **TC-7.2b: Missing Origin rejected on state-changing route**
  - Given: The server is running
  - When: A POST to `/auth/login` omits the Origin header
  - Then: Response is 403 `ORIGIN_REJECTED`

**AC-7.3:** GET requests to exempt paths (only `/oauth/callback` in Epic 1) pass without Origin validation.

- **TC-7.3a: GET /oauth/callback passes without Origin**
  - Given: The server is running
  - When: A GET to `/oauth/callback` omits the Origin header
  - Then: Response is 501 `NOT_IMPLEMENTED` (not 403)

**AC-7.4:** On state-changing routes, the Origin preHandler runs before the session gate. Origin rejection happens before the session check.

- **TC-7.4a: Origin rejected before session check**
  - Given: No session cookie and a mismatched Origin
  - When: A POST is made to any state-changing gated route
  - Then: Response is 403 `ORIGIN_REJECTED` (not 401 `AUTH_REQUIRED`)

**AC-8.1 (parts — TC-8.1a, TC-8.1b):** Envelope shapes for the 401 and 403 paths.

- **TC-8.1a: 401 envelope shape**
  - Given: A gated route hit without session
  - When: The response arrives
  - Then: Body parses as `{ error: { code: "AUTH_REQUIRED", message: <non-empty> } }`
- **TC-8.1b: 403 envelope shape**
  - Given: A state-changing route hit with mismatched Origin
  - When: The response arrives
  - Then: Body parses as `{ error: { code: "ORIGIN_REJECTED", message: <non-empty> } }`

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**preHandler ordering on state-changing gated routes:**

```
Origin preHandler  →  Session preHandler  →  Route handler
     (403?)              (401?)                (200/501/…)
```

Origin runs first so a badly-configured renderer produces 403, not 401 (AC-7.4).

**Allowed Origin set (Epic 1):**

| Origin | Source |
|--------|--------|
| `http://localhost:5173` | Vite dev server |
| `http://127.0.0.1:5173` | Vite dev server (IPv4 alias) |
| `app://panel` | Production Electron renderer (`app://` protocol registered in Story 7) |

**Session cookie:**

| Property | Value |
|----------|-------|
| Cookie name | `panel_session` |
| Secret | `process.env.PANEL_COOKIE_SECRET` if ≥32 chars; else deterministic dev default (to be replaced in Epic 2 with keychain-backed per-install secret) |
| Sealing library | iron-session 8 |
| Payload shape (Epic 1 reads only) | `{ broadcasterId: string, issuedAt: number }` |

`sealFixtureSession({ broadcasterId, issuedAt, ttlSeconds })` returns a sealed cookie string; installed now for Epic 2's positive-path tests.

**Gate inheritance verification (TC-2.5a):** a test registers a new route through `registerRoute(app, { method: 'GET', url: '/test-gated', handler: ... })` with no gate-related code. Injecting a request without a cookie returns 401.

**Test files (new in Story 4):**
- `shared/src/http/gateExempt.test.ts` — 1 test (TC-2.3a)
- `server/src/gate/originPreHandler.test.ts` — 4 tests (TC-7.2a, TC-7.2b, TC-7.4a, TC-8.1b)
- `server/src/gate/sessionPreHandler.test.ts` — 3 tests (missing cookie, malformed cookie, valid sealed cookie — non-TC)

**Previously-skipped tests un-skipped here** (see Story 2's test-status table for the authoritative list of which TCs were `.skip`'d):
- `routes/auth.test.ts` un-skips: TC-6.2a, TC-6.2b, TC-2.3c, TC-8.1c
- `routes/oauthCallback.test.ts` un-skips: TC-2.3b
- `routes/liveEvents.test.ts` un-skips: TC-6.3a, TC-6.4a

The tests that passed live in Story 2 through the Story 1 stub (TC-2.2a, TC-6.3b, TC-3.4b, TC-8.1a) continue to pass in Story 4 against the real preHandler — no un-skip needed; their observable behavior is unchanged.

**Tests delivered this story:** 8 new tests in the files above, plus every previously-authored `test.skip` from Story 2 flips live. The exact count of un-skipped tests is whatever Story 2's Red commit authored with skip guards — authoritative count lives in `test-plan.md` per-file tables, not duplicated here.

See [`../tech-design-server.md`](../tech-design-server.md) §Origin Validation and §Session Gate (staged delivery) and [`../tech-design.md`](../tech-design.md) §Verification Scripts for `.red-ref` mechanics, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] Session preHandler reads exempt paths from the `GATE_EXEMPT_PATHS` export defined in Story 0; Story 4 does not redefine the constant
- [ ] `originPreHandler` rejects missing Origin and Origin not in allowed set; attaches nothing to the request
- [ ] `sessionPreHandler` uses iron-session `unsealData`; missing cookie throws `AUTH_REQUIRED`; tampered/expired cookie throws `AUTH_REQUIRED`; valid cookie attaches `session` to request
- [ ] `@fastify/cookie` registered with `config.cookieSecret`
- [ ] `sealFixtureSession()` helper exports work and produce cookies `unsealData` accepts
- [ ] Every `test.skip` from Story 2 is un-skipped and passes
- [ ] `.red-ref` mechanism in place; Story 4's Red commit writes it
- [ ] 8 new test entries pass in Story 4 (1 `gateExempt` + 4 `originPreHandler` + 3 `sessionPreHandler`); every `test.skip` authored in Story 2 is un-skipped and passes
- [ ] Fastify `decorate('config', config)` exposed so preHandlers read `req.server.config`
- [ ] `pnpm green-verify` passes (verifies no test files changed since `.red-ref`)
