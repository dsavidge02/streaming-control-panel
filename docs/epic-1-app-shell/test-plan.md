# Test Plan: Epic 1 — App Shell & Landing

Every TC from the epic maps to a concrete test (or an observed-run checklist item, for TCs that are not programmatically testable). This plan is the authoritative `TC → Test` mapping; the index ([`tech-design.md`](./tech-design.md)) and companions ([`tech-design-server.md`](./tech-design-server.md), [`tech-design-client.md`](./tech-design-client.md)) link their flows into this table.

---

## Table of Contents

- [Test Philosophy](#test-philosophy)
- [Mock Strategy](#mock-strategy)
- [Fixtures and Utilities](#fixtures-and-utilities)
- [Test Layers and Entry Points](#test-layers-and-entry-points)
- [TC → Test Mapping](#tc--test-mapping)
- [Chunk Breakdown with Test Counts](#chunk-breakdown-with-test-counts)
- [Test Count Reconciliation](#test-count-reconciliation)
- [Observed-Run Checklist (Non-Programmatic TCs)](#observed-run-checklist-non-programmatic-tcs)

---

## Test Philosophy

Service-mock first, per the skill's testing reference:

- **Test at the entry point.** Fastify routes via `app.inject()`. Renderer components via React Testing Library with the real router. The internal modules (gate preHandlers, palette provider, `registerRoute` wiring) are exercised, not mocked.
- **Mock at external boundaries only.** The filesystem (SQLite file location), the network (renderer fetch to the Fastify server when we want renderer-side tests to run in isolation), and the OS userData path are mocked. Internal domains — registrar, preHandlers, error handler, session gate — are never mocked by anything inside Epic 1.
- **Observed-run tests** carry TCs that can't be programmatically asserted (packaging, CI on real PRs, hot reload). These live in §Observed-Run Checklist, not in the test files.
- **Test files never change during TDD Green.** Story 4's Red commit writes `.red-ref`; every subsequent Green commit runs `guard:no-test-changes` against that ref.

---

## Mock Strategy

| Boundary | Mock? | Why | Tool |
|----------|-------|-----|------|
| **Fastify HTTP boundary** | Don't mock — use `app.inject()` | We want real routing, real preHandlers, real error handler. `inject()` fires through the full stack without binding a port | Fastify's built-in `inject()` |
| **SQLite file location** | Substitute `:memory:` in tests | Isolates tests from dev's real SQLite file | `buildServer({ inMemoryDb: true })` |
| **OS userData path** | Substitute a temp directory | For TC-9.1a/9.1b that need file persistence across "launches" | `mkdtempSync` + `openDatabase(path.join(temp, 'panel.sqlite'))` |
| **iron-session cookie** | Seal real cookies with `sealFixtureSession()` | We want real iron-session `unsealData` to run; just pre-mint the sealed value | `sealFixtureSession({ broadcasterId, issuedAt })` from `server/test/` |
| **System time** | Fake timers for heartbeat cadence test only | TC-6.3a needs time to advance | `vi.useFakeTimers()` |
| **Fastify server (from renderer tests)** | Mock the `authApi.ts` module at the module boundary | Component tests want to test the renderer's reaction to typed responses, not a real server | `vi.mock('@/api/authApi')` |
| **Electron APIs in main-process tests** | Mock `electron.app.getPath()` | Tests run in pure Node; no Electron runtime | `vi.mock('electron', () => ({ app: { getPath: () => tempDir } }))` |
| **localStorage** | Use jsdom's built-in window.localStorage | For palette persistence test | jsdom provides this natively |

### The One Module We Mock in Renderer Tests

Tests of `<Landing>` or `<SignInButton>` mock `@/api/authApi` — NOT the hook (`useSignIn`) and not `fetchClient`. We want the real `useSignIn` + real React state + real React Router. The mock just controls what `postAuthLogin()` returns, so we can assert the component handles all `ApiResult` shapes correctly.

```typescript
// ✅ Correct mock boundary
vi.mock('@/api/authApi', () => ({
  postAuthLogin: vi.fn(),
}));

// ❌ Wrong — this would skip the hook logic
vi.mock('@/hooks/useSignIn');
```

---

## Fixtures and Utilities

Story 0 lands these. Every downstream story consumes them.

### `apps/panel/server/src/test/buildTestServer.ts`

```typescript
import { buildServer, type BuildServerOptions } from '../server/buildServer.js';

export async function buildTestServer(overrides: Partial<BuildServerOptions> = {}) {
  return buildServer({
    inMemoryDb: true,
    config: {
      port: 0,                              // we never listen; irrelevant
      allowedOrigins: ['http://localhost:5173', 'app://panel'],
      cookieSecret: 'test-secret-32-chars-minimum-padding',
      ...(overrides.config ?? {}),
    },
    ...overrides,
  });
}
```

### `apps/panel/server/src/test/sealFixtureSession.ts`

See main companion §Session Gate for implementation.

### `apps/panel/server/src/test/tempSqlitePath.ts`

```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function tempSqlitePath(): { filePath: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'panel-test-'));
  const filePath = path.join(dir, 'panel.sqlite');
  return { filePath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
```

### `apps/panel/client/src/test/renderWithRouter.tsx`

```typescript
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PaletteProvider } from '@/palette/PaletteProvider';
import type { ReactElement } from 'react';

export function renderWithRouter(
  ui: ReactElement,
  options: { route?: string; routerState?: unknown } & RenderOptions = {},
) {
  const { route = '/', routerState, ...rest } = options;
  return render(
    <MemoryRouter initialEntries={[{ pathname: route, state: routerState }]}>
      <PaletteProvider>{ui}</PaletteProvider>
    </MemoryRouter>,
    rest,
  );
}
```

### `apps/panel/client/src/test/mockFetch.ts`

```typescript
export function withFetchRecorder<T>(fn: () => Promise<T>): Promise<{ result: T; calls: Request[] }> {
  const calls: Request[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = vi.fn(async (input, init) => {
    calls.push(new Request(input as RequestInfo, init));
    // Default: never resolves so mount-phase isn't mistaken for a completed request
    return new Promise(() => {});
  }) as typeof fetch;
  return fn()
    .then((result) => ({ result, calls }))
    .finally(() => { globalThis.fetch = original; });
}
```

TC-1.4b uses this to assert no HTTP is issued on mount.

---

## Test Layers and Entry Points

Three test suites; each tags its entry point.

| Suite | Scope | Entry | Runner |
|-------|-------|-------|--------|
| `server/src/**/*.test.ts` | Server-side service mocks, unit tests | `buildTestServer()` for routes; direct imports for pure units | Vitest (Node env) |
| `client/src/**/*.test.tsx` | Component + hook tests | `renderWithRouter()` | Vitest (jsdom env) |
| `shared/src/**/*.test.ts` | Shared package units (error registry, schemas) | Direct imports | Vitest (Node env) |

Per-package `vitest.config.ts` sets the env. Monorepo-level `pnpm test` fans out via `pnpm -r test`.

**Playwright suite ships in Story 5** (D3). Story 0 writes a `test:e2e` placeholder that exits 0 with a SKIP notice; Story 5 replaces it with `playwright test`, adds the 17 baseline screenshots per `ui-spec.md` §Verification Surface, and adds `testBypass.test.ts` for the state-forcing parser. The `test:e2e` script is only invoked by `verify-all`, which runs locally before merge and post-package (Story 8). CI PR runs (`pnpm verify`) deliberately skip Playwright to stay fast.

---

## TC → Test Mapping

Grouped by test file. Every TC appears exactly once. The TC ID is present in the test name or a comment for traceability.

### `server/src/server/buildServer.test.ts` — Fastify bootstrap

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-7.1a | `resolved config targets 127.0.0.1:7077` | `loadConfig()` | `config.host === '127.0.0.1'` AND `config.port === 7077` |
| — | `app.listen receives host and port from resolved config` | spy on `fastify.listen`, call `startServer()` with `listen` stubbed to resolve without binding | `listen` called with `{ host: '127.0.0.1', port: 7077 }` |

**Total: 2 tests**

Rationale: Actually binding port 7077 during CI is brittle (port contention, cleanup ordering). Asserting on the resolved config + the arguments passed to `fastify.listen` proves the binding intent without requiring a real socket. The observed-run checklist (TC-1.1b, TC-3.1a) exercises a real bind end-to-end in `pnpm start`.

### `server/src/server/registerRoute.test.ts` — Central registrar

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-2.5a | `new server route registered without gate code returns 401 unauth` | `buildTestServer()`, `registerRoute(app, { method:'GET', url:'/test-gated', handler })`, inject with no cookie | status 401, body `{ error: { code: 'AUTH_REQUIRED' } }` |
| — | `exempt: true without path in GATE_EXEMPT_PATHS throws on registration` | `buildTestServer()`, call `registerRoute(app, { method:'GET', url:'/not-in-list', exempt: true })` | throws error |
| — | `state-changing exempt route runs Origin preHandler` | register `POST /auth/login`-like exempt route, inject without Origin | status 403 `ORIGIN_REJECTED` |

**Total: 3 tests** (1 TC + 2 non-TC decided tests — edge cases that lock in D5's safety behavior)

### `server/src/server/errorHandler.test.ts` — Central error handler

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-8.1d | `500 catch-all envelope shape` | register test route that throws generic Error | status 500, `{ error: { code: 'SERVER_ERROR', message: non-empty } }`, message contains no stack text |
| TC-8.2a | `central error handler catches thrown errors from test route` | register test route throwing `new Error('boom')` | handler produces envelope, not the route |
| — | `INPUT_INVALID envelope returned for Zod validation failure` | register route with Zod body schema, inject invalid body | status 400, `{ error: { code: 'INPUT_INVALID' } }` |

**Total: 3 tests** (2 TCs + 1 non-TC — INPUT_INVALID path not in a TC but worth locking in)

### `server/src/routes/auth.test.ts` — /auth/login stub

Authored in Chunk 2. All four tests depend on Origin validation, which lands in Chunk 4. Chunk 2's Red commit lands all four with `test.skip()` wrapping the status-code assertion; Chunk 4's Red commit removes the `.skip` and the tests go live.

| TC | Chunk delivery | Test name | Setup | Assert |
|----|----------------|-----------|-------|--------|
| TC-6.2a | Chunk 2 authored, Chunk 4 un-skips | `POST /auth/login returns 501 NOT_IMPLEMENTED with matching Origin` | inject POST with `Origin: app://panel` | status 501, envelope code `NOT_IMPLEMENTED` |
| TC-6.2b | Chunk 2 authored, Chunk 4 un-skips | `POST /auth/login returns 403 ORIGIN_REJECTED with mismatched Origin` | inject POST with `Origin: http://evil.com` | status 403, envelope code `ORIGIN_REJECTED` |
| TC-2.3c | Chunk 2 authored, Chunk 4 un-skips | `POST /auth/login reaches handler unauthenticated (exempt)` | inject POST with matching Origin, no cookie | status 501 (not 401) |
| TC-8.1c | Chunk 2 authored, Chunk 4 un-skips | `501 envelope shape is { error: { code: NOT_IMPLEMENTED, message: non-empty } }` | inject POST with matching Origin | schema check on body |

**Total: 4 tests** — all live after Chunk 4.

### `server/src/routes/oauthCallback.test.ts` — /oauth/callback stub

Mix of Chunk 2 and Chunk 4 delivery. TC-6.1a, TC-7.3a, TC-3.4a pass immediately in Chunk 2 (GET is not Origin-checked, and the route is session-exempt); TC-2.3b depends on the real session preHandler landing in Chunk 4.

| TC | Chunk delivery | Test name | Setup | Assert |
|----|----------------|-----------|-------|--------|
| TC-6.1a | Chunk 2 (live) | `GET /oauth/callback returns 501` | inject GET | status 501, envelope code `NOT_IMPLEMENTED` |
| TC-2.3b | Chunk 2 authored, Chunk 4 un-skips | `GET /oauth/callback reaches handler unauthenticated (exempt)` | inject GET, no cookie | status 501 (not 401) |
| TC-7.3a | Chunk 2 (live) | `GET /oauth/callback passes without Origin header` | inject GET without Origin | status 501 (not 403) |
| TC-3.4a | Chunk 2 (live) | `server-only mode: GET /oauth/callback responds` | via buildTestServer inject | status 501 |

**Total: 4 tests** — 3 live in Chunk 2, 1 un-skipped in Chunk 4.

### `server/src/routes/liveEvents.test.ts` — /live/events SSE

Authored in Chunk 2. TC-6.3a and TC-6.4a depend on a valid session (via `sealFixtureSession()`), which needs the real iron-session preHandler + `sealData` helper landing in Chunk 4. TC-6.3b, TC-2.2a, TC-3.4b, TC-8.1a all exercise the 401 path — these work with the Chunk-1 stub preHandler and are live from Chunk 2.

| TC | Chunk delivery | Test name | Setup | Assert |
|----|----------------|-----------|-------|--------|
| TC-6.3a | Chunk 2 authored, Chunk 4 un-skips | `heartbeat cadence: at least one heartbeat within 30s simulated time` | `vi.useFakeTimers()`, inject GET with sealed cookie via `sealFixtureSession()`, advance 30s, capture emitted events | at least one `event: heartbeat\ndata: {...}` emitted |
| TC-6.3b | Chunk 2 (live) | `unauthenticated subscribe returns 401` | inject GET without cookie | status 401, envelope code `AUTH_REQUIRED` |
| TC-6.4a | Chunk 2 authored, Chunk 4 un-skips | `heartbeat event payload parses against shared SSE schema` | after connecting with cookie, parse first event against `heartbeatEventSchema` | parse succeeds, `type === 'heartbeat'`, `data === {}` |
| TC-2.2a | Chunk 2 (live) | `unauthenticated /live/events returns 401 AUTH_REQUIRED envelope` | inject GET, no cookie | status 401, body matches envelope |
| TC-3.4b | Chunk 2 (live) | `server-only mode: /live/events gated unauth → 401` | buildTestServer inject | status 401 |
| TC-8.1a | Chunk 2 (live) | `401 envelope shape` | inject /live/events unauth | `{ error: { code: 'AUTH_REQUIRED', message: non-empty } }` |

**Total: 6 tests** — 4 live in Chunk 2, 2 un-skipped in Chunk 4.

### `server/src/gate/originPreHandler.test.ts` — Origin validation

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-7.2a | `POST with non-allowlisted Origin rejected 403` | inject POST /auth/login `Origin: http://evil.com` | status 403 `ORIGIN_REJECTED` |
| TC-7.2b | `POST with missing Origin header rejected 403` | inject POST /auth/login without Origin | status 403 `ORIGIN_REJECTED` |
| TC-7.4a | `Origin rejected before session check (ordering test)` | gated state-changing route, inject POST no cookie + bad Origin | status 403 `ORIGIN_REJECTED` (not 401) |
| TC-8.1b | `403 envelope shape for ORIGIN_REJECTED` | inject triggering Origin reject | body is `{ error: { code: 'ORIGIN_REJECTED', message: non-empty } }` |

**Total: 4 tests**

### `server/src/gate/sessionPreHandler.test.ts` — Session gate

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| — | `missing cookie on gated route returns 401 AUTH_REQUIRED` | register test gated route, inject no cookie | status 401, envelope code `AUTH_REQUIRED` |
| — | `malformed cookie on gated route returns 401 AUTH_REQUIRED` | inject with `panel_session=garbage` | status 401 |
| — | `valid sealed cookie on gated route passes` | inject with cookie minted via `sealFixtureSession()` | status reflects handler's response |

**Total: 3 tests** (all non-TC decided — the epic's TCs for the session gate are captured in `liveEvents.test.ts` and `registerRoute.test.ts`; these tests directly exercise the preHandler unit for confidence during Story 4 changes)

### `shared/src/http/gateExempt.test.ts` — Exempt list

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-2.3a | `exempt list contains exactly /auth/login and /oauth/callback` | import `GATE_EXEMPT_PATHS` | `expect(GATE_EXEMPT_PATHS).toEqual(['/auth/login', '/oauth/callback'])` |

**Total: 1 test**

### `shared/src/errors/codes.test.ts` — Error registry

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-8.3a | `registry contains starter set` | import `ERROR_CODES` | all of `AUTH_REQUIRED`, `ORIGIN_REJECTED`, `NOT_IMPLEMENTED`, `SERVER_ERROR`, `INPUT_INVALID` are keys |
| — | `each registry entry has status and defaultMessage` | iterate entries | each has numeric status 100-599 and non-empty message |
| — | `AppError carries code + status + message` | `new AppError('AUTH_REQUIRED')` | `.code`, `.status === 401`, `.message === default` |

**Total: 3 tests** (1 TC + 2 non-TC)

### `server/src/data/db.test.ts` — SQLite open + migrations

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-9.1a | `first launch creates SQLite file at userData path` | `tempSqlitePath()`, `openDatabase(filePath)`, `applyMigrations()` | file exists after applyMigrations |
| TC-9.1b | `second launch reuses file (PRAGMA user_version sentinel)` | open, apply migrations, set `PRAGMA user_version = 42`, close; reopen, read `PRAGMA user_version` | value === 42 |
| TC-9.2a | `migrations run before HTTP is served` | `buildTestServer()` and assert query succeeds for install_metadata | row exists immediately after `buildTestServer()` resolves |
| TC-9.2b | `migrations are idempotent on relaunch` | apply twice, no throw | no error on second apply |
| TC-9.4a | `exactly one baseline migration applied` | read `__drizzle_migrations` table | one row |
| TC-9.4b | `no feature-specific tables present` | `SELECT name FROM sqlite_master WHERE type='table'` | table names match `['__drizzle_migrations', 'install_metadata']` — no `tokens`, `commands`, `chatters`, etc. |
| — | `install_metadata has exactly one row after migration` | `SELECT COUNT(*)` | 1 |
| — | `install_metadata row has expected defaults` | select row | `app_version === '0.1.0'`, `schema_version === 1`, `created_at` within last minute |

**Total: 8 tests** (6 TCs + 2 non-TC)

### `client/src/views/Landing.test.tsx` — Landing view

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-1.2a | `landing view content inventory` | `renderWithRouter(<Landing />)` | product name, description paragraph present, exactly 5 capability items visible, 1 sign-in button visible |
| TC-1.4b | `no outbound HTTP on mount` | `withFetchRecorder(() => renderWithRouter(<Landing />))` | `calls.length === 0` |
| TC-2.4a | `landing reachable unauthenticated` | `renderWithRouter(<Landing />, { route: '/' })` | renders without redirect |
| — | `redirect flash appears when router state carries redirectedFrom` | `renderWithRouter(<Landing />, { route:'/', routerState: { redirectedFrom: '/home' } })` | banner text contains `/home` |

**Total: 4 tests** (3 TCs + 1 non-TC)

### `client/src/components/SignInButton.test.tsx` — Sign-in button + hook

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-1.3a | `sign-in button is active` | `renderWithRouter(<SignInButton />)` | button is in the document, not disabled, has accessible name |
| TC-1.3b | `activation invokes POST /auth/login` | mock `postAuthLogin`, user-click | `postAuthLogin` called exactly once |
| TC-1.3c | `renderer surfaces error message keyed to error code` | mock returns `{ status:'error', code:'NOT_IMPLEMENTED', message:'server says foo' }`, click, wait | user-visible text contains "Epic 2" and "server says foo" |
| — | `button shows LOADING during pending state` | mock returns a pending promise, click | button text changes; button is disabled |
| — | `button shows error card on ORIGIN_REJECTED` | mock returns code: ORIGIN_REJECTED | error card visible with matching code text |
| — | `reset clears error state` | click, then click dismiss | error card removed, button re-enabled |

**Total: 6 tests** (3 TCs + 3 non-TC)

### `client/src/app/router.test.tsx` — Client-side routing

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| TC-2.1a | `/home redirects to landing unauth` | `renderWithRouter(<RouterProvider router={router} />, { route:'/home' })` | landing rendered, URL state indicates redirect |
| TC-2.1b | `/settings redirects to landing unauth` | route: '/settings' | landing rendered |
| TC-2.1c | `unknown gated path redirects to landing` | route: '/foo-bar-baz' | landing rendered |
| TC-2.5b | `a newly registered gated route inherits the gate` | register a test `defineRoute({ gated: true })`, navigate to it | redirected to landing |
| TC-2.6a | `/home and /settings are registered as gated` | inspect `routes` array | both present, `gated === true` |

**Total: 5 tests**

### `client/src/palette/PaletteProvider.test.tsx` — Palette system

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| — | `default palette applied on first render (Amber CRT)` | `renderWithRouter(<Dummy />)` | `getComputedStyle(document.documentElement).getPropertyValue('--panel-primary')` matches amber primary |
| — | `switching palette updates CSS vars` | render, call `setPalette('neon')`, wait | CSS vars reflect neon |
| — | `persisted palette loads from localStorage` | seed localStorage `panel.palette=cream`, render | cream tokens applied |
| — | `switching palette writes to localStorage` | render, `setPalette('beacon')` | localStorage now `beacon` |
| — | `invalid localStorage value falls back to default` | seed `panel.palette=garbage`, render | amber applied |

**Total: 5 tests** (all non-TC — palette system is design-time expectation, not epic AC coverage)

### `client/src/api/fetchClient.test.ts` — Fetch wrapper

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| — | `success response returns { status: success, data }` | mock fetch returns 200 JSON | result shape |
| — | `error envelope parsed into typed error` | mock fetch returns 501 + envelope | `{ status: 'error', code: 'NOT_IMPLEMENTED' }` |
| — | `malformed error body falls back to SERVER_ERROR` | mock returns 500 with garbage body | `{ status:'error', code:'SERVER_ERROR' }` |
| — | `network failure returns synthesized SERVER_ERROR` | mock fetch rejects | `{ status:'error', code:'SERVER_ERROR', httpStatus: 0 }` |

**Total: 4 tests** (all non-TC — the wrapper's correctness is foundational for the TCs on SignInButton)

### `client/src/api/authApi.test.ts` — Auth client

Covered transitively by `SignInButton.test.tsx`. No dedicated file.

**Total: 0 tests**

### `client/src/palette/PaletteSwitcher.test.tsx` — Switcher component

| TC | Test name | Setup | Assert |
|----|-----------|-------|--------|
| — | `all 5 palettes rendered as swatches` | render | 5 buttons, names match |
| — | `clicking a swatch calls setPalette with its id` | click, spy on context | setPalette called with correct id |
| — | `active swatch visually distinguished` | render with amber active | amber button has aria-pressed=true |

**Total: 3 tests** (all non-TC — the switcher UX is design-time, verified through palette tests + visual spec)

---

## Chunk Breakdown with Test Counts

Stories from the epic map 1:1 to chunks here.

### Chunk 0: Monorepo + Tooling Foundation (Story 0)

**Scope:** pnpm workspace; Biome + TS + Vitest configs; empty `AppError` + `ERROR_CODES` map; verification scripts; placeholder `test:e2e`.

**ACs:** AC-8.3 (registry starter set).

**TCs:** TC-8.3a.

**Relevant Tech Design Sections:** index §Workspace Layout; server §Workspace Layout; server §Error Model; server §Verification Scripts.

**Non-TC Decided Tests:** each registry entry has status+message; AppError carries code+status+message.

**Test file:** `shared/src/errors/codes.test.ts` (3 tests).

**Tests delivered this chunk:** 3
**Running total:** 3

### Chunk 1: Fastify Server + Central Route Wiring (Story 1)

**Scope:** Fastify bootstrap, `registerRoute` helper, `setErrorHandler`, config module with port/host constants.

**ACs:** AC-7.1, AC-8.1d, AC-8.2.

**TCs:** TC-7.1a, TC-8.1d, TC-8.2a.

**Relevant Tech Design Sections:** server §Fastify Bootstrap; server §Central Registrar; server §Error Model; server §Server Binding.

**Non-TC Decided Tests:** exempt:true-without-listing throws; state-changing exempt route runs Origin; INPUT_INVALID envelope from Zod.

**Test files:**
- `server/src/server/buildServer.test.ts` (1 test — TC-7.1a)
- `server/src/server/registerRoute.test.ts` (3 tests — TC-2.5a + 2 non-TC edge)
- `server/src/server/errorHandler.test.ts` (3 tests — TC-8.1d, TC-8.2a + 1 non-TC INPUT_INVALID)

Note: TC-2.5a first becomes testable once `registerRoute` lands in Chunk 1 even though its AC reads "new route inherits gate." The gate *behavior* needs Chunk 4's Origin + session preHandlers to be wired — but Chunk 1 can test `registerRoute` returns 401 by having Chunk 1 also land a stub `sessionPreHandler` that always throws `AUTH_REQUIRED`. When Chunk 4 replaces the stub with the real preHandler, the test continues to pass.

**Tests delivered this chunk:** 8
**Running total:** 11

### Chunk 2: Stub Endpoints (Story 2)

**Scope:** `/auth/login` (501), `/oauth/callback` (501), `/live/events` heartbeat, shared SSE envelope.

**ACs:** AC-6.1, AC-6.3 (cadence), AC-6.4, AC-8.1c, AC-3.4 (observable via inject).

**TCs delivered in full here:** TC-6.1a, TC-6.3a, TC-6.4a, TC-8.1c, TC-3.4a.

**TCs delivered in part (closed in Chunk 4):** TC-6.2a, TC-6.2b, TC-6.3b, TC-2.3b, TC-2.3c, TC-3.4b — these need Origin + real session preHandlers from Chunk 4.

**Relevant Tech Design Sections:** server §Routes; server §SSE.

**Non-TC Decided Tests:** (none — all natural TCs are sufficient for Chunk 2).

**Test files:**
- `server/src/routes/oauthCallback.test.ts` (4 tests — TC-6.1a, TC-2.3b, TC-7.3a, TC-3.4a)
- `server/src/routes/liveEvents.test.ts` (6 tests — all 6 TCs covering heartbeat and auth — requires Chunk 4's session gate; see below)
- `server/src/routes/auth.test.ts` (4 tests — TC-6.2a, TC-6.2b, TC-2.3c, TC-8.1c — also needs Chunk 4)

**Chunk 2 practical split:** The test files above are authored here, but tests that depend on Origin/session preHandlers are `test.skip(...)` stubs until Chunk 4's Green delivers them. Chunk 2's Red: author all tests with `.skip` on Chunk-4-dependent ones. Chunk 4's Red: un-skip. Chunk 2's Green: make non-skipped tests pass.

Counts below reflect the total tests in the files (which is what AC coverage looks like when complete), not partial delivery. Chunk 4 takes credit for un-skipping the remainder.

**Tests delivered this chunk:** 14 authored. Tests that exercise the GET-exempt path pass immediately in Chunk 2 (TC-6.1a, TC-7.3a, TC-3.4a in `oauthCallback.test.ts`). Tests that exercise Origin validation or session gating are authored with `test.skip()` on the dependent assertion until Chunk 4 un-skips them; this keeps the Chunk 2 Red commit meaningful without re-authoring tests in Chunk 4.
**Running total authored:** 25

### Chunk 3: Data Layer Bootstrap (Story 3)

**Scope:** SQLite at userData, `@electron/rebuild` postinstall, Drizzle runner, baseline migration.

**ACs:** AC-9.1, AC-9.2, AC-9.3, AC-9.4.

**TCs:** TC-9.1a, TC-9.1b, TC-9.2a, TC-9.2b, TC-9.4a, TC-9.4b. (TC-9.3a is an observed-run — the test suite running successfully on the dev's OS *is* the validation.)

**Relevant Tech Design Sections:** server §Data Layer; server §Baseline Migration.

**Non-TC Decided Tests:** install_metadata row count; default palette value.

**Test files:**
- `server/src/data/db.test.ts` (8 tests)

**Tests delivered this chunk:** 8
**Running total authored:** 33

### Chunk 4: Server-Side Gate + Origin + Session + Cookie Defaults (Story 4)

**Scope:** Default-gated preHandler with exempt list; Origin preHandler on state-changing routes; iron-session install; `sealFixtureSession` helper; un-skip Chunk 2 tests.

**ACs:** AC-2.2, AC-2.3, AC-2.5a, AC-6.2 (full), AC-6.3 (unauth path), AC-7.2, AC-7.3, AC-7.4, AC-8.1a, AC-8.1b.

**TCs closed here (new):** TC-2.2a, TC-2.3a, TC-2.3b, TC-2.3c, TC-6.2a, TC-6.2b, TC-6.3b, TC-7.2a, TC-7.2b, TC-7.3a, TC-7.4a, TC-8.1a, TC-8.1b, TC-3.4b.

(TC-2.3b and TC-7.3a already live in `oauthCallback.test.ts` from Chunk 2 but flip from test.skip to live here.)

**Relevant Tech Design Sections:** server §Origin Validation; server §Session Gate; server §Central Registrar.

**Non-TC Decided Tests:** session preHandler direct unit tests (3).

**Test files:**
- `shared/src/http/gateExempt.test.ts` (1 test — TC-2.3a)
- `server/src/gate/originPreHandler.test.ts` (4 tests)
- `server/src/gate/sessionPreHandler.test.ts` (3 tests — non-TC)
- Previously authored tests flip from skip to live: 8 tests in `auth.test.ts`, `oauthCallback.test.ts`, `liveEvents.test.ts`

**Tests delivered this chunk (new):** 8 new test entries + 11 previously-authored un-skipped = 19 tests now passing that were not before.

Chunk 4 flips every previously-skipped test to live:

- Chunk 2 authored 11 tests with `test.skip()` guards on their Origin/session assertions (4 in `auth.test.ts` needing Origin, 6 in `liveEvents.test.ts` needing session, 1 in `oauthCallback.test.ts` needing session)
- Chunk 4 adds: 1 (`gateExempt.test.ts`) + 4 (`originPreHandler.test.ts`) + 3 (`sessionPreHandler.test.ts`) = 8 new tests
- Chunk 4 un-skips all 11 previously-skipped tests
- End of Chunk 4: 40 authored, 0 skipped

**Running total authored:** 41

### Chunk 5: React Renderer + Landing View (Story 5)

**Scope:** React 19 + Vite 8 + Tailwind 4.1 + shadcn/ui; landing view per reference; 5 palette token sets + switcher; sign-in handler; renderer-only dev mode; `testBypass.ts` DEV-only state-forcing; Playwright harness + 17 baseline screenshots.

**ACs:** AC-1.2, AC-1.3, AC-1.4, AC-3.3.

**TCs:** TC-1.2a, TC-1.3a, TC-1.3b, TC-1.3c, TC-1.4b. (TC-1.4a, TC-3.3a are observed-run — dev server URL visible in browser.)

**Relevant Tech Design Sections:** client §Landing View; client §State-Driving Query Flags; client §Palette System; client §Sign-In Handler; client §API Client; ui-spec entirely.

**Non-TC Decided Tests:** sign-in loading state, error card for ORIGIN_REJECTED, reset-clear; 4 fetchClient tests; 3 switcher tests; 5 palette provider tests; 1 redirect-flash on Landing; 17 Playwright screenshot tests.

**Test files:**
- `client/src/views/Landing.test.tsx` (4 tests)
- `client/src/components/SignInButton.test.tsx` (6 tests)
- `client/src/palette/PaletteProvider.test.tsx` (5 tests)
- `client/src/palette/PaletteSwitcher.test.tsx` (3 tests)
- `client/src/api/fetchClient.test.ts` (4 tests)
- `client/src/app/testBypass.test.ts` (3 tests — DEV-bypass forced-state parser + production-safety strip)
- `client/tests/e2e/landing.spec.ts` (17 Playwright screenshot tests per the state matrix in `ui-spec.md` §Verification Surface)

**Tests delivered this chunk:** 42 (22 component/unit + 3 testBypass + 17 Playwright)
**Running total:** 83

### Chunk 6: Client-Side Router + Gating + Placeholders (Story 6)

**Scope:** React Router 7; route registry; `<RequireAuth>` guard; empty `/home` + `/settings`; redirect-to-landing.

**ACs:** AC-2.1, AC-2.4, AC-2.5b, AC-2.6.

**TCs:** TC-2.1a, TC-2.1b, TC-2.1c, TC-2.4a, TC-2.5b, TC-2.6a.

(TC-2.4a is delivered by `Landing.test.tsx` from Chunk 5 but also tested here in router context for belt-and-suspenders.)

**Relevant Tech Design Sections:** client §Router; client §Route Registry and Gating; client §RequireAuth Guard.

**Non-TC Decided Tests:** (none — routing TCs are sufficient).

**Test files:**
- `client/src/app/router.test.tsx` (5 tests)

**Tests delivered this chunk:** 5
**Running total:** 88

### Chunk 7: Electron Main Process + Full-App Mode (Story 7)

**Scope:** Electron 41 hosting Fastify + renderer; `app://` protocol; `pnpm start` end-to-end; HMR.

**ACs:** AC-1.1, AC-3.1, AC-3.2, AC-3.5.

**TCs:** TC-1.1a, TC-1.1b, TC-3.1a, TC-3.2a, TC-3.5a — all observed-run except TC-3.5a.

**Relevant Tech Design Sections:** server §Electron Shell; server §Window Management; server §Packaging.

**Non-TC Decided Tests:** none programmatic. TC-3.5a ("dev-mode documentation exists") is assertable via a small test that greps README for the three commands.

**Test files:**
- `server/src/electron/readme.test.ts` (1 test — TC-3.5a: `grep -E "pnpm start|pnpm --filter client dev|pnpm --filter server dev" README.md` equivalent via node:fs)

**Tests delivered this chunk:** 1
**Running total:** 89

### Chunk 8: Packaged Build for Developer OS (Story 8)

**Scope:** electron-builder config; `pnpm package`; host-OS artifact.

**ACs:** AC-4.1, AC-4.2, AC-4.3.

**TCs:** TC-4.1a, TC-4.2a — observed-run. TC-4.3a — assertable via README grep.

**Cross-cutting verification note:** Story 8 adds an automated boot-verify gate via `pnpm smoke:packaged` (Playwright-electron-style launch of `dist/packaged/win-unpacked/*.exe` with `SMOKE_MODE=1`, polling `http://127.0.0.1:7077/auth/login` for the expected `NOT_IMPLEMENTED` envelope). This gate runs alongside (not in place of) the observed-run checks TC-4.1a/TC-4.2a — the human observed-run confirms the landing view renders visually, while the smoke gate catches boot-time failures (missing asar content, native ABI mismatch, absent migration assets, packaged-only whenReady hangs) that are invisible to the dev-path `pnpm verify`. See `docs/epic-1-app-shell/stories/decisions-log.md` Decision #4 for the rationale.

**Relevant Tech Design Sections:** server §Packaging.

**Test files:**
- `server/src/electron/readme-package.test.ts` (1 test — TC-4.3a: README contains packaging command name)

**Tests delivered this chunk:** 1
**Running total:** 90

### Chunk 9: CI Workflow (Story 9)

**Scope:** GitHub Actions on `pull_request` against `main`; Ubuntu; `verify`; merge gate; script-parity.

**ACs:** AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5.

**TCs:** TC-5.1a through TC-5.5b — all observed-run tests (verified by seeing a PR run) plus two structural YAML checks that can be automated.

**Relevant Tech Design Sections:** server §CI.

**Test files:**
- `tools/ci/workflow.test.ts` (2 tests — TC-5.3a: no `electron-builder` or release-publish actions in ci.yml; TC-5.4a: every `run:` in ci.yml maps to a `pnpm` script defined in root package.json)

Location note: this test is a workspace-root concern, not part of a package. Lives under `tools/ci/` with its own minimal `vitest.config.ts` or picked up by the root `pnpm test` fan-out via a workspace entry.

**Tests delivered this chunk:** 2
**Running total:** 92

---

## Test Count Reconciliation

| Chunk | Chunk label | Tests delivered | Running total (authored) |
|-------|-------------|------------------|---------------------------|
| 0 | Tooling Foundation | 3 | 3 |
| 1 | Fastify Server | 8 | 11 |
| 2 | Stub Endpoints | 14 authored (some `.skip`ped until Chunk 4 un-skips) | 25 |
| 3 | Data Layer | 8 | 33 |
| 4 | Gate + Origin + Session | 8 new (+ 11 un-skipped from Chunk 2) | 41 |
| 5 | Renderer + Landing + Playwright | 42 (22 component + 3 testBypass + 17 Playwright) | 83 |
| 6 | Client Router | 5 | 88 |
| 7 | Electron + Full-App | 1 | 89 |
| 8 | Packaged Build | 1 | 90 |
| 9 | CI | 2 | 92 |

**Grand total: 92 automated tests across 22 test files** (75 Vitest + 17 Playwright).

**Per-file totals (cross-check):**

| File | Tests |
|------|-------|
| `shared/src/errors/codes.test.ts` | 3 |
| `shared/src/http/gateExempt.test.ts` | 1 |
| `server/src/server/buildServer.test.ts` | 2 |
| `server/src/server/registerRoute.test.ts` | 3 |
| `server/src/server/errorHandler.test.ts` | 3 |
| `server/src/routes/oauthCallback.test.ts` | 4 |
| `server/src/routes/liveEvents.test.ts` | 6 |
| `server/src/routes/auth.test.ts` | 4 |
| `server/src/gate/originPreHandler.test.ts` | 4 |
| `server/src/gate/sessionPreHandler.test.ts` | 3 |
| `server/src/data/db.test.ts` | 8 |
| `server/src/electron/readme.test.ts` | 1 |
| `server/src/electron/readme-package.test.ts` | 1 |
| `tools/ci/workflow.test.ts` | 2 |
| `client/src/views/Landing.test.tsx` | 4 |
| `client/src/components/SignInButton.test.tsx` | 6 |
| `client/src/app/router.test.tsx` | 5 |
| `client/src/palette/PaletteProvider.test.tsx` | 5 |
| `client/src/palette/PaletteSwitcher.test.tsx` | 3 |
| `client/src/api/fetchClient.test.ts` | 4 |
| `client/src/app/testBypass.test.ts` | 3 |
| `client/tests/e2e/landing.spec.ts` | 17 (Playwright) |
| **Sum** | **92** ✓ |

Per-file sum (92) = per-chunk sum (92) = grand total (92). Reconciled. 75 Vitest + 17 Playwright.

---

## Observed-Run Checklist (Non-Programmatic TCs)

Some Epic 1 TCs are not programmatically assertable. They are verified by the developer running the commands and observing the result. Each item below lands in the README with a one-line checklist entry and is re-verified at the end of each story that introduces new dev-mode surface.

| TC | AC | Observation | Command / Action | Expected Result |
|----|-----|-------------|-------------------|-----------------|
| TC-1.1a | AC-1.1 | Packaged artifact opens to landing | Launch artifact from `dist/packaged/` | Electron window opens, landing view visible, sign-in button present |
| TC-1.1b | AC-1.1 | `pnpm start` opens to landing | `pnpm install && pnpm start` | Electron window opens, landing view visible |
| TC-1.4a | AC-1.4 | Landing renders with server absent (renderer-only) | `pnpm --filter client dev`, open Vite URL in browser | Landing view renders |
| TC-3.1a | AC-3.1 | Full-app mode starts | `pnpm start` | Electron window opens to landing |
| TC-3.2a | AC-3.2 | Renderer HMR | Edit a renderer source file during `pnpm start` | Change visible without Electron restart |
| TC-3.3a | AC-3.3 | Renderer-only serves landing | `pnpm --filter client dev` + browser | Landing view renders with AC-1.2 content |
| TC-4.1a | AC-4.1 | Packaging produces host-OS artifact | `pnpm package` | Artifact appears in `dist/packaged/` |
| TC-4.2a | AC-4.2 | Packaged artifact boots to landing | Launch artifact | Landing view visible |
| TC-5.1a | AC-5.1 | CI triggers on PR | Open a PR against `main` | `CI / verify` workflow begins, Ubuntu runner |
| TC-5.2a | AC-5.2 | Lint fails CI on violation | Push PR with Biome violation | Lint step red |
| TC-5.2b | AC-5.2 | Typecheck fails CI on violation | Push PR with TS error | Typecheck step red |
| TC-5.2c | AC-5.2 | Unit test failure fails CI | Push PR with failing Vitest | Test step red |
| TC-5.2d | AC-5.2 | Green PR produces green CI | Push clean PR | All steps pass |
| TC-5.5a | AC-5.5 | Failing CI blocks merge | Observe merge button on failing PR | Merge blocked until CI passes |
| TC-5.5b | AC-5.5 | CI does not run on main push | Push commit directly to main (in a fresh test repo) | No workflow run triggered by push |
| TC-9.3a | AC-9.3 | Native-module rebuild succeeds | `pnpm install && pnpm start` on dev's host OS | SQLite opens without `NODE_MODULE_VERSION` error |

Each item is marked off in the story's README section as it's verified. Stories 1, 5, 7, 8, 9 each touch this checklist.

---

## Related Documentation

- Index: [`tech-design.md`](./tech-design.md)
- Server companion: [`tech-design-server.md`](./tech-design-server.md)
- Client companion: [`tech-design-client.md`](./tech-design-client.md)
- UI spec: [`ui-spec.md`](./ui-spec.md)
- Epic: [`./epic.md`](./epic.md)
