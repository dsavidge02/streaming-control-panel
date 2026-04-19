# Story 2: Stub Endpoints

### Summary
<!-- Jira: Summary field -->

Register the three Epic 1 HTTP routes (`POST /auth/login`, `GET /oauth/callback`, `GET /live/events`) through the central registrar, and emit SSE heartbeat on `/live/events`.

### Description
<!-- Jira: Description field -->

**User Profile:** Developer. A streamer does not directly observe these routes in Epic 1 — the renderer hits `POST /auth/login` in Story 5.

**Objective:** Register the three route paths that Epic 1 reserves. `/oauth/callback` and `/auth/login` are exempt from the session gate and return 501 `NOT_IMPLEMENTED`. `/live/events` is an SSE endpoint behind the session gate; on an authenticated subscription it emits a `heartbeat` event every 15 seconds (chosen to satisfy the epic's "at least every 30 seconds" with margin). Epic 2 replaces the `/auth/login` body with the OAuth redirect; Epic 4a adds real event producers on top of the SSE transport.

**Scope — In:**
- `apps/panel/server/src/routes/auth.ts` — `registerAuthRoutes(app)`: `POST /auth/login` via `registerRoute` with `exempt: true`; handler throws `AppError('NOT_IMPLEMENTED', ...)`
- `apps/panel/server/src/routes/oauthCallback.ts` — `registerOauthCallbackRoute(app)`: `GET /oauth/callback` via `registerRoute` with `exempt: true`; handler throws `AppError('NOT_IMPLEMENTED', ...)`
- `apps/panel/server/src/routes/liveEvents.ts` — `registerLiveEventsRoute(app)`: `GET /live/events` (not exempt, so session gate applies); SSE response with `Content-Type: text/event-stream`, initial `heartbeat` event on connect, then every 15 seconds via `setInterval`; cleanup on `req.raw.on('close')`
- `apps/panel/shared/src/sse/events.ts` — Zod schemas: `heartbeatEventSchema` (type literal `heartbeat`, data `{}`), `sseEventSchema` as discriminated union
- All three `register*` functions wired into `buildServer`'s route registration step

**Scope — Out:**
- Origin validation on `/auth/login` — stub is a no-op pass-through from Story 1; real Origin validation lands in Story 4
- Real session gate on `/live/events` — Story 1's stub throws `AUTH_REQUIRED` unconditionally (which is what TC-6.3b and TC-2.2a assert); Story 4 installs real iron-session so a sealed cookie passes the gate
- OAuth redirect body in `/auth/login` — Epic 2
- Real event producers on `/live/events` — Epic 4a

**Dependencies:** Story 1 (central registrar, error handler, `GATE_EXEMPT_PATHS` consumed).

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

**AC-6.1:** `GET /oauth/callback` is registered on the exempt-path list and returns HTTP 501 with `{ code: "NOT_IMPLEMENTED" }`.

- **TC-6.1a: Callback returns 501**
  - Given: The server is running
  - When: A GET is made to `/oauth/callback`
  - Then: Response is 501 and body contains `{ error: { code: "NOT_IMPLEMENTED", message: <non-empty> } }`

**AC-6.3 (partial — cadence only):** `GET /live/events` is an SSE endpoint registered behind the server-side session gate. While an authenticated subscriber is connected, the endpoint emits a `heartbeat` event at least once every 30 seconds. Chosen interval: 15 seconds (tech design D10).

- **TC-6.3a: Heartbeat cadence (unit, simulated time)**
  - Given: A mocked authenticated session attached to the handler, with test time advancement
  - When: The test advances simulated time by 30 seconds after a subscriber connects
  - Then: At least one `heartbeat` event has been emitted
  - *Story 2 note:* Authored here; the "authenticated" setup requires the real session preHandler + `sealFixtureSession()` helper from Story 4. Test is authored with `test.skip` on the auth-dependent setup in Story 2's Red commit; Story 4 un-skips when the real preHandler lands. The cadence logic itself (15s interval, initial heartbeat on connect) ships and is exercisable in isolation here.

**AC-6.4:** SSE events conform to a typed envelope defined in the shared package. `heartbeat` is the first registered event type; its payload is an empty object in Epic 1.

- **TC-6.4a: Heartbeat event shape**
  - Given: An emitted heartbeat event
  - When: The event payload is parsed against the shared SSE event schema
  - Then: Parsing succeeds, the event type is `heartbeat`, and the data payload is an empty object
  - *Story 2 note:* Authored here with `test.skip` wrapper pending Story 4's session helper; the schema and emitter are fully implemented in this story. Story 4 un-skips.

**AC-8.1 (part — TC-8.1c only):** All non-2xx responses from registered HTTP routes use envelope `{ error: { code: <string>, message: <string> } }`. This story delivers the 501 envelope shape for `/oauth/callback` (GET, no Origin check required).

- **TC-8.1c: 501 envelope shape**
  - Given: `/oauth/callback` is hit in Epic 1
  - When: The response arrives
  - Then: Body parses as `{ error: { code: "NOT_IMPLEMENTED", message: <non-empty> } }`

**AC-3.4 (partial — TC-3.4a only):** `pnpm --filter server dev` runs Fastify standalone on `127.0.0.1:7077`. Registered routes behave per their gated/exempt policies. This story delivers the `/oauth/callback` response path; TC-3.4b (gated `/live/events` returns 401) closes in Story 4 when the real session gate replaces the stub.

- **TC-3.4a: /oauth/callback stub responds**
  - Given: Server-only mode is running
  - When: A GET is made to `/oauth/callback`
  - Then: Response is 501 `NOT_IMPLEMENTED`

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**HTTP routes registered in this story:**

| Operation | Method | Path | Gated? | Origin-check? | Response |
|-----------|--------|------|--------|---------------|----------|
| Sign-in stub | POST | `/auth/login` | Exempt | Yes (Story 4 delivers the check; Story 1 stub is pass-through) | 501 `NOT_IMPLEMENTED` |
| OAuth callback stub | GET | `/oauth/callback` | Exempt | No (GET) | 501 `NOT_IMPLEMENTED` |
| Live events SSE | GET | `/live/events` | Yes | No (GET) | SSE stream (heartbeat only) |

**SSE event envelope:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Event type (Epic 1: `heartbeat`) |
| `data` | object | yes | Event-type-specific payload (Epic 1 `heartbeat` payload: `{}`) |

**SSE wire format:** manual emitter using `reply.raw.writeHead(200, { 'Content-Type': 'text/event-stream', ... })` and `reply.raw.write('event: heartbeat\ndata: {"type":"heartbeat","data":{}}\n\n')`. No `@fastify/sse-v2` dependency in Epic 1 (revisit Epic 4a per tech-design Open Question Q2).

**Heartbeat emitter behavior:**
- On connect: emit one `heartbeat` immediately (supports test-time advancement)
- Every 15 seconds: emit `heartbeat`
- On `req.raw.on('close')`: `clearInterval`

**Test-status table — authoritative for Story 2 and Story 4 reconciliation:**

| Test file | TC | Status in Story 2 | Status in Story 4 |
|-----------|-----|-------------------|-------------------|
| `routes/oauthCallback.test.ts` | TC-6.1a | Live (GET, exempt, 501 returned) | Still live |
| `routes/oauthCallback.test.ts` | TC-7.3a | Live (GET bypasses Origin preHandler in both stub and real states) | Still live |
| `routes/oauthCallback.test.ts` | TC-3.4a | Live (exempt GET reaches handler via Story 1 registrar) | Still live |
| `routes/oauthCallback.test.ts` | TC-2.3b | `test.skip` (real session preHandler needed to prove exempt-bypass is a real exemption, not a happen-to-pass) | Un-skipped, flips live |
| `routes/liveEvents.test.ts` | TC-6.3b | Live (stub session preHandler always throws `AUTH_REQUIRED` → 401) | Still live |
| `routes/liveEvents.test.ts` | TC-2.2a | Live (same reason as TC-6.3b) | Still live |
| `routes/liveEvents.test.ts` | TC-3.4b | Live (same) | Still live |
| `routes/liveEvents.test.ts` | TC-8.1a | Live (same — envelope shape on 401) | Still live |
| `routes/liveEvents.test.ts` | TC-6.3a | `test.skip` (needs `sealFixtureSession()` from Story 4 to attach a valid session) | Un-skipped, flips live |
| `routes/liveEvents.test.ts` | TC-6.4a | `test.skip` (same reason as TC-6.3a) | Un-skipped, flips live |
| `routes/auth.test.ts` | TC-6.2a | `test.skip` (needs real Origin preHandler from Story 4) | Un-skipped, flips live |
| `routes/auth.test.ts` | TC-6.2b | `test.skip` (same) | Un-skipped, flips live |
| `routes/auth.test.ts` | TC-2.3c | `test.skip` (same) | Un-skipped, flips live |
| `routes/auth.test.ts` | TC-8.1c | `test.skip` (same) | Un-skipped, flips live |

**Summary:** 14 tests authored in this story's Red commit. 7 pass immediately (live) through Story 1's stubs; 7 are `test.skip` pending Story 4's real preHandlers. Story 4 un-skips all 7. Story 2 and Story 4 DoDs use this table as the source of truth; neither story contradicts it.

**Methodology note on `test.skip` in a Red commit:** a Red commit with `test.skip` does not "fail" the skipped tests; they are inert until Story 4 un-skips them. This is a deliberate test-plan choice — the skipped tests are scaffolding for Story 4's Red-to-Green transition, where un-skipping flips them from inert to failing (Story 4 Red) and then to passing (Story 4 Green).

See [`../tech-design-server.md`](../tech-design-server.md) §Routes and §SSE, and [`../test-plan.md`](../test-plan.md) Chunk 2 for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] All three routes registered via `registerRoute` (not `app.get/post` directly)
- [ ] `/auth/login` and `/oauth/callback` throw `AppError('NOT_IMPLEMENTED', ...)` with meaningful messages; `exempt: true` in both cases
- [ ] `/live/events` sends `Content-Type: text/event-stream`, emits initial heartbeat on connect, then every 15s
- [ ] Heartbeat cleanup runs on connection close
- [ ] `heartbeatEventSchema` and `sseEventSchema` exported from `@panel/shared/sse`
- [ ] 14 tests authored across the three route test files per the test-status table above; 7 live and passing in Story 2, 7 `test.skip`'d with explicit comments referencing Story 4
- [ ] Every `test.skip` has a comment pointing to Story 4 and the specific dependency (Origin preHandler or `sealFixtureSession()`)
- [ ] `pnpm verify` passes (skipped tests do not fail the run)
