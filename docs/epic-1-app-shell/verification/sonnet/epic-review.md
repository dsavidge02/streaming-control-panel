# Epic 1 — Sonnet Reviewer Report

## Executive summary

Epic 1 delivered a fully functional app shell with all 38 ACs and 54 TCs covered. The implementation is high-quality overall — correct typing, clean architecture patterns (central registrar, error envelope, session gate, defineRoute factory), and well-targeted test coverage. The primary concern is a test-design gap in TC-6.3a (heartbeat cadence) where the fake-timer path actually bypasses the interval rather than exercising it, making the heartbeat cadence unverified. Secondary concerns are several packaging-layer workarounds that leave observable debt in `package.json` and `electron-builder.yml`. **Ship-readiness grade: B.**

---

## Critical findings

None. All AC-specified behaviors are implemented correctly. Server binds to `127.0.0.1:7077`. Origin preHandler runs before session gate. Session gate correctly returns 401. Error envelopes match spec shape. Playwright baselines committed. Drizzle migration runs before HTTP serves. `node-linker=hoisted` present in `.npmrc`.

---

## Major findings

### M1 — TC-6.3a does not verify heartbeat interval cadence

**Affected file:** `apps/panel/server/src/routes/liveEvents.ts:29-31`, `apps/panel/server/src/routes/liveEvents.test.ts:27-57`

**Evidence:**

`liveEvents.ts` implements a `timerMode` guard:

```typescript
if (req.server.config.timerMode === "fake") {
  reply.raw.end();   // closes the response immediately
  return reply;
}
const interval = setInterval(() => emitHeartbeat(), HEARTBEAT_INTERVAL_MS);
```

When `buildTestServer()` is called (which uses `timerMode: 'real'` by default — `config.ts:59`), TC-6.3a calls `buildTestServer()` without overriding timerMode. That means `timerMode` is `'real'` in the test, the `if (req.server.config.timerMode === 'fake')` block is NOT taken, and the `setInterval` IS installed. However, `vi.useFakeTimers()` then intercepts `setInterval`, and `vi.advanceTimersByTimeAsync(30_000)` should advance it. So the test should actually exercise the interval.

BUT: `app.inject()` with Fastify is a synchronous mock transport. The SSE handler calls `reply.raw.writeHead(200, ...)`, emits an initial heartbeat, then starts a `setInterval`. With `vi.useFakeTimers()`, the `setInterval` call returns a fake timer. Then `vi.advanceTimersByTimeAsync(30_000)` should fire the interval callback. However, the `app.inject()` promise doesn't resolve until `reply.raw.end()` is called (or the connection closes), and the handler never calls `reply.raw.end()` (it returns `reply` with the stream open). This means the `responsePromise` from `app.inject()` may never resolve without the timer advancing closing the connection.

The test sequence is:
1. Start `responsePromise = app.inject(...)` 
2. `await vi.advanceTimersByTimeAsync(30_000)` — this fires the setInterval callback
3. `response = await responsePromise` — this awaits the inject result

The question is whether Fastify's `inject()` resolves after the initial write. Looking at Fastify's inject implementation: `inject()` resolves when the response stream ends (i.e., when `reply.raw.end()` is called or the underlying stream closes). Since the SSE handler never calls `end()`, the inject promise may never resolve — or Fastify may buffer the response and resolve after the first write.

In practice, the initial `emitHeartbeat()` before the `timerMode` check emits the first event. Then `vi.advanceTimersByTimeAsync(30_000)` fires the interval and emits a second heartbeat. If Fastify's inject buffers and resolves after some time (or after fake timers advance), the test passes. If it hangs waiting for `reply.raw.end()`, the test would time out.

Given that the team-impl-log reports all 77 Vitest tests pass, the test does resolve. This means Fastify's inject resolves the buffered response without requiring `reply.raw.end()`. The test asserts `expect(response.body).toContain("event: heartbeat")` — which is satisfied by the INITIAL heartbeat, not necessarily the interval. The interval fires too but that's not specifically asserted.

**The real gap:** TC-6.3a asserts that a heartbeat event was emitted within 30 simulated seconds — but the initial heartbeat (emitted unconditionally before the timer guard) satisfies this assertion regardless of whether the interval mechanism works. The test does not assert that a SECOND heartbeat was emitted (which would prove the interval fires). A broken `setInterval` (e.g., wrong interval value or callback never firing) would still pass TC-6.3a.

**AC impact:** AC-6.3 states "the endpoint emits a `heartbeat` event at least once every 30 seconds." The test only proves one heartbeat is emitted, not the periodic cadence.

**Spec reference:** Epic §AC-6.3, TC-6.3a, test-plan.md §`liveEvents.test.ts`

**Suggested fix:** Assert that at least TWO heartbeat events are emitted after advancing 30+ seconds of fake time (or advance to 31s and count occurrences). Alternatively, assert that advancing ONLY 14 seconds produces zero interval-fired events, and advancing to 16 seconds produces one — which would specifically verify the 15-second interval, not just the initial emit.

---

### M2 — Root `package.json` runtime dependencies are packaging workarounds that need lifecycle ownership

**Affected file:** `package.json:30-46`

**Evidence:**

`package.json` at the repo root contains 11 runtime `dependencies` (fastify, better-sqlite3, drizzle-orm, iron-session, zod, etc.). These are workspace-package runtime deps hoisted to the root to work around electron-builder's traversal limitations under pnpm (decisions-log Decision #9). The decisions-log states these should be removable under `node-linker=hoisted` but the removal was not yet validated: "Under hoisted, these should be removable."

The decisions-log explicitly marks this as a standing TODO: "When Story 9 (CI) runs: needs evaluation" and "Flag the dependencies block should NOT be re-added by future stories without strong justification."

**Risk:** Future story implementers will see runtime deps at root level and may not know they're temporary workarounds. If someone removes them assuming they're not needed (correct instinct, wrong timing), packaging may break silently. If someone adds more deps here without justification, the workaround expands.

**Spec reference:** `docs/epic-1-app-shell/stories/decisions-log.md` Decision #9

**Suggested fix:** Add a prominent comment block in `package.json` above the `dependencies` key explaining these are packaging workarounds pending validation that hoisted pnpm makes them unnecessary. Assign a specific story (likely Epic 2 setup story) to validate and remove them.

---

### M3 — `electron-builder.yml` contains dead asarUnpack pattern

**Affected file:** `electron-builder.yml:18-20`

**Evidence:**

```yaml
asarUnpack:
  - "**/*.node"
  - "node_modules/better-sqlite3/**/*"
  - "node_modules/.pnpm/**/node_modules/better-sqlite3/**/*"
```

Decisions-log Decision #6 documents that under `node-linker=hoisted`, `better-sqlite3` lives in `node_modules/better-sqlite3/` (flat), NOT under `.pnpm/`. The `.pnpm/**/node_modules/better-sqlite3/**/*` pattern matches nothing. The `node_modules/better-sqlite3/**/*` pattern is also likely redundant because `**/*.node` already covers the `.node` file. The decisions-log says "prune the dead line; either is functionally equivalent, but pruning clarifies the config."

**Risk:** This dead config misleads future readers about the actual packaging layout. It also means any CI investigation of packaging issues will need to understand which of these rules is actually active.

**Spec reference:** `docs/epic-1-app-shell/stories/decisions-log.md` Decision #6

**Suggested fix:** Remove the `.pnpm/` asarUnpack pattern. Optionally also remove `node_modules/better-sqlite3/**/*` since `**/*.node` is sufficient for the native binding.

---

## Minor findings

### m1 — `shared/src/errors/` consolidates envelope schema into `codes.ts` (spec had separate `envelope.ts`)

**Affected file:** `apps/panel/shared/src/errors/codes.ts`

**Evidence:** The tech-design specified a separate `apps/panel/shared/src/errors/envelope.ts` containing `errorEnvelopeSchema` and `ErrorEnvelope`. In the implementation, these live in `codes.ts` alongside `ERROR_CODES` and `AppError`. The spec's file layout in `tech-design-server.md` §Package layout shows three files (`codes.ts`, `AppError.ts`, `envelope.ts`); the implementation uses one. Additionally, `AppError` and `ERROR_CODES` are co-located in `codes.ts` (spec had `AppError.ts` as a separate file).

**Impact:** None functional. The public API exported from `shared/src/index.ts` is unchanged. This simplifies the file count. Tech-design file tree is outdated, which could confuse future readers onboarding from the spec.

**Suggested fix:** Update `tech-design-server.md` §Package layout to reflect the actual single-file `codes.ts` implementation if not done before Epic 2.

---

### m2 — TC-6.3b and TC-2.2a and TC-8.1a in `liveEvents.test.ts` are three near-identical tests

**Affected file:** `apps/panel/server/src/routes/liveEvents.test.ts:6-25`, `:94-113`, `:136-158`

**Evidence:** TC-6.3b, TC-2.2a, and TC-8.1a all make the exact same request (GET `/live/events` with no cookie) and assert the same response (401 + `AUTH_REQUIRED` envelope + non-empty message). The only difference is the test name. This is tautological duplication — if the implementation passes one, it passes all three, and none would independently catch a regression the others miss.

**Impact:** This is spec-directed duplication (the test plan explicitly maps these three TCs to the same file). The spec's coverage-by-TC philosophy requires separate test entries even when the underlying behavior is identical. The duplication is not a defect per the spec, but it reduces the informational density of the test suite.

**Suggested fix:** Accept as-is (spec-directed). For Epic 2 or later, consider whether the test plan's per-TC-per-test mapping can be satisfied by a single parameterized test with multiple TC labels.

---

### m3 — `registerRoute.test.ts` uses a module-level mock on `originPreHandler` that could mask real behavior

**Affected file:** `apps/panel/server/src/server/registerRoute.test.ts:7-16`

**Evidence:**

```typescript
vi.mock("../gate/originPreHandler.js", async () => {
  const actual = await vi.importActual<...>();
  return {
    ...actual,
    originPreHandler: vi.fn(actual.originPreHandler),
  };
});
```

The test mocks `originPreHandler` with `vi.fn(actual.originPreHandler)` — this wraps the real function so it still executes but is observable via `expect(...).toHaveBeenCalled()`. The test "runs originPreHandler for state-changing exempt routes" then asserts `vi.mocked(originPreHandlerModule.originPreHandler).toHaveBeenCalled()`. This works but creates a coupling between the test and the module import path. If `registerRoute.ts` ever imports `originPreHandler` through a different path or re-exports it, the mock would silently become ineffective.

**Impact:** Low. The current implementation is correct. This is a future maintenance fragility, not a current defect.

---

### m4 — `buildServer.test.ts` second test is a tautology

**Affected file:** `apps/panel/server/src/server/buildServer.test.ts:13-33`

**Evidence:**

```typescript
it("app.listen receives host and port from resolved config", async () => {
  const result = await buildServer({ inMemoryDb: true });
  const listenSpy = vi.spyOn(result.app, "listen").mockResolvedValue("ok" as never);
  await result.app.listen({ host: result.config.host, port: result.config.port });
  expect(listenSpy).toHaveBeenCalledWith({ host: "127.0.0.1", port: 7077 });
});
```

The test calls `result.app.listen` directly with `result.config.host` and `result.config.port` — i.e., the caller passes the values, not `buildServer` or `startServer`. This test asserts that what you pass to `listen` is what `listen` receives, which is trivially true and independent of whether `startServer` actually uses those values. A correct test would spy on `listen` and then call `startServer()` (which internally calls `app.listen({ host: config.host, port: config.port })`), not call `listen` directly.

**Impact:** TC-7.1a is the actual binding test and it covers the real behavior via `loadConfig()`. The second test adds false confidence that `startServer` threads the host/port correctly through to `listen`. If someone changed `startServer` to call `listen({ host: '0.0.0.0', port: 9999 })`, this test would still pass.

**Suggested fix:** Refactor to `vi.spyOn(result.app, 'listen').mockResolvedValue(...)` then call `startServer()` (or provide a way to call the listen path through `buildServer` + spy).

---

### m5 — `package.json` `start` script runs `rebuild:electron` on every start

**Affected file:** `package.json:9`

**Evidence:**

```json
"start": "pnpm rebuild:electron && electron-vite dev"
```

`pnpm rebuild:electron` runs `electron-rebuild -f -w better-sqlite3` on every `pnpm start`. On a developer's machine this adds ~5-15 seconds to startup every time (rebuild takes non-trivial time). The rebuild is only necessary if the ABI has changed (e.g., after `pnpm install` upgraded electron). Running it unconditionally on every start is defensive but slow.

**Impact:** Developer experience degrades. AC-3.1 says `pnpm start` must open Electron, not that it must rebuild on every invocation. The decisions-log mentions this may simplify once hoisted pnpm is confirmed working, but doesn't address the latency cost.

**Suggested fix:** Accept for Epic 1 (correctness over speed). Document in README that `pnpm start` includes a rebuild step and may be slow. Epic 2 can optimize with a cached ABI check.

---

### m6 — Missing `Hero` import and component reference in `tech-design-client.md` (actual Landing.tsx has no `<Hero>` component)

**Affected file:** `apps/panel/client/src/views/Landing.tsx:1-60`, `docs/epic-1-app-shell/tech-design-client.md §Landing View`

**Evidence:** The tech-design-client `Landing.tsx` composition shows:
```typescript
import { Hero } from '../components/Hero.js';
```
and includes `<Hero />` in the layout. The actual `Landing.tsx` does import and use `<Hero />` (line 10: `import { Hero } from "@/components/Hero"`). A `Hero.tsx` file exists at `apps/panel/client/src/components/Hero.tsx`. No issue with the implementation — this is consistent. The tc-1.2a test assertion `expect(screen.getByText(/CONTROL\/\/PANEL/)).toBeInTheDocument()` finds the NavBar's brand text (not a "Hero" heading), and the test also finds the description text. This is fine.

---

### m7 — `testBypass.ts` double-redundant DEV check

**Affected file:** `apps/panel/client/src/app/testBypass.ts:31-32`

**Evidence:**
```typescript
export function readForcedState(): ForcedStateResolved | null {
  if (!isTestBypassEnabled()) return null;
  if (!import.meta.env.DEV) return null;  // ← redundant; isTestBypassEnabled() already checks this
```

`isTestBypassEnabled()` returns `import.meta.env.DEV`. The second check on line 32 is identical. This is harmless (both are compile-time constants that Rollup eliminates in production builds) but it's redundant dead code.

**Suggested fix:** Remove the second `if (!import.meta.env.DEV) return null;` line.

---

### m8 — `smoke:packaged` not in CI (acknowledged gap in decisions-log)

**Affected file:** `.github/workflows/ci.yml`, `docs/epic-1-app-shell/stories/decisions-log.md`

**Evidence:** The decisions-log Standing TODOs include: "When Story 9 (CI workflow) runs: `ci.yml` must include `pnpm smoke:packaged` as a gate (or accept that packaged-artifact verification is local-only until release-engineering epic)." The CI workflow does NOT include `pnpm smoke:packaged`. The decision accepted that packaging verification remains local-only until the release-engineering epic.

**Impact:** Packaging defects of the class found in Story 8 (hollow asar, native ABI mismatch, missing migrations) are not caught by CI. A PR that breaks packaging would pass CI and could merge.

**Spec reference:** decisions-log Standing TODOs §Story 9

**Suggested fix:** Accept as explicit trade-off per decisions-log. Track as a post-M3 release-engineering item. Ensure Epic 2+ stories do not skip `pnpm verify-full` before merging when they touch packaging-sensitive code paths.

---

## Coverage verification

### AC coverage summary

All 38 ACs are covered per `coverage.md`. No unmapped ACs. Split ACs (AC-2.5, AC-3.4, AC-6.3, AC-8.1) documented with per-TC story assignment. Coverage gate passes.

| Flow | ACs | Status |
|------|-----|--------|
| Landing view | AC-1.1 to AC-1.4 | Covered |
| Route gating | AC-2.1 to AC-2.6 | Covered |
| Dev modes | AC-3.1 to AC-3.5 | Covered (observed-run for TC-3.1a/3.2a/3.3a) |
| Packaging | AC-4.1 to AC-4.3 | Covered (observed-run for TC-4.1a/4.2a) |
| CI | AC-5.1 to AC-5.5 | Covered (observed-run for TC-5.1a through TC-5.5b) |
| Stub endpoints | AC-6.1 to AC-6.4 | Covered |
| Trust boundary | AC-7.1 to AC-7.4 | Covered |
| Error envelope | AC-8.1 to AC-8.3 | Covered |
| Persistence | AC-9.1 to AC-9.4 | Covered |

### TC coverage summary

All 54 TCs are covered. 16 observed-run (packaging, CI, dev-mode launch). 38 programmatically tested. No orphan TCs.

**Actual test counts (from team-impl-log):**
- 77 Vitest live (4 shared + 2 ci-tools + 39 server + 32 client)
- 17 Playwright baselines
- 1 boot-verify gate (`pnpm smoke:packaged`)

The test plan spec'd 92 (75 Vitest + 17 Playwright). The implementation shipped 94 programmatic tests (77 Vitest + 17 Playwright) — 2 more than spec'd. The extra 2 are `tools/ci/workflow.test.ts` (TC-5.3a + TC-5.4a), which the test plan counts as part of Chunk 9.

Reconciliation: The test plan's "75 Vitest" count includes the `tools/ci/` tests (2) as Story 9 deliverables. The team-impl-log's "77 Vitest" count includes these 2 plus what appears to be additional non-TC decided tests that were added during implementation. This is a minor positive — more tests, not fewer.

### Stories 0–9 DoD satisfaction

| Story | Vitest Count | Key Deliverables | DoD Status |
|-------|-------------|-----------------|------------|
| 0 | 3 (shared) | pnpm workspace, Biome, TS, Vitest, AppError registry | Accepted |
| 1 | 8 (server) | Fastify on 127.0.0.1:7077, registerRoute, errorHandler | Accepted |
| 2 | 14 (server, some needed Chunk 4 to go live) | /auth/login stub, /oauth/callback, /live/events heartbeat | Accepted |
| 3 | 8 (server) | SQLite userData path, Drizzle migrations, install_metadata | Accepted |
| 4 | 8 new + 11 un-skipped (server/shared) | Gate preHandler, Origin preHandler, session gate | Accepted |
| 5 | 22 client + 3 testBypass + 17 Playwright | Landing view, 5 palettes, sign-in handler | Accepted |
| 6 | 5 (client) | React Router, RequireAuth, /home + /settings placeholders | Accepted |
| 7 | 1 (server/electron) | Electron shell, app:// protocol, pnpm start | Accepted |
| 8 | 1 (server/electron) | electron-builder config, pnpm package, smoke:packaged | Accepted |
| 9 | 2 (tools/ci) | ci.yml, TC-5.3a + TC-5.4a structural checks | Accepted |

---

## Test quality assessment (77 Vitest + 17 Playwright + 1 smoke)

### Strong tests

**`server/src/gate/originPreHandler.test.ts`** — TC-7.4a specifically validates preHandler ordering by asserting that a gated POST route with no cookie + bad Origin returns 403 (not 401), proving Origin runs before session. This is exactly the right behavior-specific assertion that would catch an ordering regression.

**`server/src/server/errorHandler.test.ts`** — TC-8.1d explicitly asserts that the error message does NOT contain `SENSITIVE_STACK_SHOULD_NOT_LEAK`. Stack-leak prevention is tested by name, not just by envelope shape. Good negative assertion.

**`client/src/app/router.test.tsx` TC-2.5b** — Creates a test-only `defineRoute({ gated: true })` to verify inheritance without touching production routes. Correctly proves the registrar pattern, not just the existing routes.

**`server/src/data/db.test.ts` TC-9.1b** — Uses `PRAGMA user_version = 42` as a sentinel that survives DB close + reopen without being affected by Drizzle's migration logic. Clean, surgical test.

**`server/src/gate/sessionPreHandler.test.ts`** — Has a positive-path test ("valid sealed cookie reaches the handler") that goes end-to-end through `sealFixtureSession` → real `unsealData`. This proves the Epic 2 helper works correctly before Epic 2 lands.

### Weak or tautological tests

**`server/src/server/buildServer.test.ts` test 2** (see Major finding M4 above) — The "app.listen receives host and port from resolved config" test calls `listen` directly with the values, not via `startServer`. It's a tautological assertion that what you pass is received. Would not catch a regression in `startServer`.

**`server/src/routes/liveEvents.test.ts` TC-6.3a** (see Major finding M1 above) — The heartbeat cadence assertion is satisfied by the initial unconditional heartbeat emit. Does not specifically verify the interval timer fires at 15-second intervals.

**`server/src/routes/liveEvents.test.ts` TC-6.3b + TC-2.2a + TC-8.1a** (see Minor finding m2) — Three near-identical tests make the same request and expect the same response. If one fails, all three fail; if one passes, all three pass. No independent signal.

**`server/src/server/registerRoute.test.ts` TC-2.5a test name** — Test is named "returns AUTH_REQUIRED for a gated route with no gate-specific code" which is correct. However, the test uses `buildTestServer()` which applies the full server config including the stub `sessionPreHandler` (at Story 1 time) or real `sessionPreHandler` (from Story 4 onward). The test correctly proves the gate inheritance but would not distinguish between a broken gate that always returns 401 vs one that correctly checks the session.

**`shared/src/http/gateExempt.test.ts` TC-2.3a** — `expect([...GATE_EXEMPT_PATHS]).toEqual(["/auth/login", "/oauth/callback"])` — This test asserts the exact contents of a frozen constant. It is effectively testing that the source file contains what it contains (a tautology in the sense that the test would need to be updated if the list changes, and the test doesn't prove the list is *used* correctly). The value is as an explicit documentation-as-test contract; it would catch accidental list modification. Acceptable but worth noting.

### Playwright suite assessment

All 17 baselines are present in `apps/panel/client/tests/e2e/__screenshots__/`. The test file `landing.spec.ts` covers all named states from the UI spec:
- All 5 palette defaults
- sign-in-pending
- sign-in-error-501 across all 5 palettes
- sign-in-error-403 (amber only)
- sign-in-error-500 (amber only)
- redirect-home, redirect-settings (amber)
- palette-switcher-open
- responsive (960×600)

Notably absent from the spec baseline but potentially useful: a test that actually clicks the sign-in button and awaits the error card (end-to-end with Vite dev server running + mock service worker). This is beyond Epic 1 scope (Playwright tests use `testBypass` flags instead of server interaction) and is explicitly deferred.

The Playwright snapshot naming convention uses dots (e.g., `landing.default.amber.png`) in `toHaveScreenshot()` while the actual files in `__screenshots__/` use dashes (`landing-default-amber.png`). This is a known quirk: Playwright normalizes test snapshot names by joining the test name fragments. Since the test name is `landing.default.amber` and the snapshot arg is `landing.default.amber.png`, Playwright stores the file. The baseline files were generated by Playwright itself via `--update-snapshots`, so the names are authoritative. The mismatch between what's in the source code strings vs the files is confusing but not a functional defect.

---

## Interface + type safety alignment

**Shared package exports:** All five required types/values are correctly exported from `apps/panel/shared/src/index.ts`: `AppError`, `ERROR_CODES`, `ErrorCode`, `errorEnvelopeSchema`, `PATHS`, `GATE_EXEMPT_PATHS`, `sseEventSchema`, `heartbeatEventSchema`. All are typed with `as const` or Zod inference where appropriate.

**`errorEnvelopeSchema`** is a Zod schema exported from shared and consumed in `fetchClient.ts` for `safeParse` on error responses. This is the correct boundary-validation pattern. The schema uses `z.enum(Object.keys(ERROR_CODES) as [ErrorCode, ...ErrorCode[]])` — this creates a runtime enum from the `const` map keys, which is correct and keeps the enum in sync with the map.

**`heartbeatEventSchema`** uses `z.object({}).strict()` for the data payload, which correctly rejects any payload with extra keys. This is the `strict()` enforcement the spec called for. The SSE event discriminated union (`sseEventSchema`) is correctly structured for Epic 4a extension.

**`SessionPayload` interface** adds a payload validation step after `unsealData` in `sessionPreHandler.ts:29-32` (checks that `broadcasterId` is a string and `issuedAt` is a number). This is defensive programming beyond what the spec required, and it's correct.

**`BuildServerOptions`** in `buildServer.ts` includes `timerMode?: "real" | "fake"`. This is not in the spec interface definition (`tech-design-server.md §Interface Definitions`) but was added for the fake-timer test mode. The `ServerConfig` interface also carries `timerMode: "real" | "fake"`, making it a first-class config value rather than a purely test-time override. This leaks a test concern into production config but is harmless (production always uses `"real"`).

**`defineRoute` factory** correctly types `RouteDefinition` with `gated: boolean`, `path: string`, `name: string`, `toRouteObject(): RouteObject`. TC-2.6a can read `routes.find(r => r.name === 'home')?.gated` at the type level without assertions.

---

## Electron + packaging review

**`node-linker=hoisted` in `.npmrc`:** Present and correct. This was the root cause of Story 8's packaging failures.

**`electron.vite.config.ts` renderer `outDir`:** Uses `path.resolve(__dirname, "apps/panel/server/dist/renderer")` (absolute path). This is the corrected form per decisions-log Decision #2. The tech-design-server.md spec still shows a relative path (`"../../../dist/renderer"`); the doc is outdated.

**`app://` protocol registration:** `protocol.registerSchemesAsPrivileged` called at module scope in `app.ts` before any Electron `app.ready()` callbacks. This is the correct Electron API usage — registration must happen synchronously before the app is ready.

**`RENDERER_ROOT` path:** `path.join(import.meta.dirname, "../renderer")` — after electron-vite builds, `dist/main/index.js` is the entry point. `import.meta.dirname` resolves to `dist/main/`. `../renderer` resolves to `dist/renderer/`. This is correct. The original spec showed `"../../renderer"` which was wrong; the implementation uses the corrected path.

**`app.whenReady().then(...)` pattern:** Correctly avoids the ESM+TLA+Electron ready-event interaction bug documented in decisions-log. `app.requestSingleInstanceLock()` is present.

**`electronBuilder.yml` `files:` section:** Correctly includes `apps/panel/server/drizzle/**` per decisions-log Decision #3. The `node_modules/**` explicit inclusion is the hoisting workaround per Decision #9. Drizzle migrations inside asar is the correct approach (Electron patches `fs` for asar reads).

**`npmRebuild: false`:** Intentional per decisions-log Decision #5 — the explicit `rebuild:electron` script in the `package` command handles native rebuild.

**Preload script:** `apps/panel/server/src/electron/preload.ts` exists but is empty (no context bridge, no IPC). This is correct per Epic 1 scope — no preload needed until IPC is required. The electron-vite config includes the preload slot.

**`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`:** Correctly set in `window.ts`. Maximum Electron renderer security posture.

---

## Boundary inventory audit

| Boundary | Status | Notes |
|----------|--------|-------|
| Twitch OAuth (`POST /auth/login`) | Stub, 501 NOT_IMPLEMENTED | Origin-validated, session-exempt. Expected. |
| Twitch OAuth callback (`GET /oauth/callback`) | Stub, 501 NOT_IMPLEMENTED | Session-exempt, no Origin check (GET). Expected. |
| Live SSE producers | Stub, heartbeat only at 15s intervals | Gated by session gate. Expected. |
| SQLite filesystem | Integrated — `install_metadata` baseline only | No feature tables. Correct. |
| Electron shell | Integrated — `app://panel` protocol, single BrowserWindow | Correct. |
| GitHub Actions CI | Integrated — PR gate on `main` | No `smoke:packaged` in CI (acknowledged gap). |
| Session cookies | Not issued — `sealFixtureSession` helper installed | Gate only tests 401 path. Expected for Epic 1. |
| OS keychain (`keytar`) | Not started | No secrets in Epic 1. Correct. |
| Twitch Helix / EventSub | Not started | Epic 3/4a. Correct. |

**Unexpected stubs:** None found. All stubs are per-spec.

**`smoke:packaged` gate:** Exists as `scripts/smoke-packaged.mjs` and is callable via `pnpm smoke:packaged`. However, it is NOT wired into CI (decisions-log acknowledges this). The `verify-full` script (`pnpm verify-all && pnpm package && pnpm smoke:packaged`) exercises it locally. This is an acceptable deferral for Epic 1 but creates a gap where packaging regressions could merge without CI detection.

---

## UI spec compliance

The implementation faithfully delivers the neo-arcade aesthetic from `docs/references/neo_arcade_palettes.jsx`. All five palettes (Neon Night, Amber CRT, Cream Soda, Pocket Monochrome, Signal Beacon) are present with token values from the reference. Default is Amber CRT per D9.

**Landing view components all present:**
- `Marquee` — top scrolling banner
- `NavBar` — HOME/PLAY/OPTIONS tabs with gated-nav redirect callback
- `RedirectFlash` — access-denied banner with router state integration
- `Hero` — headline, description, SignInButton, ErrorEnvelopeCard
- `SystemStatusPanel` — HUD with status indicators
- `ErrorRegistryPanel` — error code registry display
- `CapabilityGrid` — 5 capability tiles (channel management, live moderation, clip creation, custom !commands, welcome bot)
- `Footer` — version, epic indicator
- `PaletteSwitcher` — collapsible palette picker with 5 swatches

**TC-1.2a content inventory:** Test asserts `CONTROL//PANEL` (NavBar brand), the description paragraph, all five capability items by text, and the sign-in button by accessible name. All pass.

**PaletteSwitcher collapsed/open state machine:** Implemented with `aria-expanded`/`aria-controls`, Escape key dismissal, and click-outside dismissal. This exceeds the original spec (which only showed the expanded state) and was added after a human visual review caught the defect in Story 5 fix round 2.

**17 Playwright baselines committed:** All states enumerated in `ui-spec.md §Verification Surface` have screenshots. The `landing-default-amber-responsive-960x600.png` baseline covers the minimum window size (960×600 per spec).

**State coverage:**
- Default (all 5 palettes) ✓
- Sign-in pending (1 palette) ✓
- Sign-in error 501 (all 5 palettes) ✓
- Sign-in error 403 (1 palette) ✓
- Sign-in error 500 (1 palette) ✓
- Redirect home (1 palette) ✓
- Redirect settings (1 palette) ✓
- Palette switcher open (1 palette) ✓
- Responsive 960×600 (1 palette) ✓

No visual regression testing was run as part of this review (baselines are committed; a fresh `pnpm test:e2e` would be needed to verify they pass). The team-impl-log confirms baselines were generated and verified during Story 5 acceptance.

---

## Ship-readiness grade

**Grade: B**

**Justification:**

Epic 1 delivers all specified ACs with correct implementations, complete test coverage, working Electron packaging, and a CI gate. The codebase is well-structured and inheritable by downstream epics.

The B grade (rather than A) reflects:

1. **TC-6.3a does not verify the heartbeat interval mechanism** (Major M1) — the AC-6.3 cadence requirement is satisfied in production (the interval is installed) but not proven by the test. A regression that breaks the interval timer would pass CI.

2. **Packaging debt is observable** (Major M2, M3) — the root-level runtime deps and dead `electron-builder.yml` asarUnpack patterns are documented workarounds that need lifecycle ownership. They don't block ship but add onboarding confusion.

3. **One tautological test and one weak test** in the server test suite (Minor m2, Major M4) reduce test suite signal quality without blocking any AC.

These are all correctable in a targeted pre-Epic-2 cleanup pass without blocking Epic 2 development from beginning on this foundation.

---

## What else did I notice but not fully investigate

1. **`apps/panel/client/src/index.ts` exists** alongside `src/main.tsx`. The file tree shows both. `index.ts` is likely a re-export or barrel file. Not read — if it interferes with the Vite entry point, it could cause subtle issues. Recommend verifying that `index.html` points to `src/main.tsx` as the entry, not `index.ts`.

2. **`apps/panel/server/src/dev.ts` exists** in the file tree but was not read. This is likely the `pnpm --filter server dev` entry point. Not verified whether it correctly starts Fastify standalone without Electron.

3. **`apps/panel/client/src/palette/paletteApi.ts`** (note: lowercase `p`, matching the actual file vs spec's `paletteApi.ts` in `api/` directory). The actual file is at `palette/paletteApi.ts`, not `api/paletteApi.ts` as the tech-design specified. This is a minor layout deviation — functionally equivalent but the import path differs from spec.

4. **The `scripts/` directory contains several mjs files** (`package-and-restore-native.mjs`, `patch-local-asar-cli.mjs`, `smoke-packaged.mjs`, `touch-better-sqlite3-binding.mjs`). These were added during Story 8's fix rounds and are referenced in `package.json` scripts. These scripts were not reviewed in detail. `patch-local-asar-cli.mjs` in `postinstall` is unusual — patching the asar CLI at install time suggests there's a bug in the asar CLI that required a monkey-patch. This deserves investigation to understand whether it's a dependency-version pin that could be removed or a long-lived workaround.

5. **TC-7.2b ("missing Origin rejected"):** The `originPreHandler.ts` check is `if (!origin)` — this handles the case where the Origin header is absent. But Fastify's `inject()` may behave differently from a real HTTP client w.r.t. the Origin header. A real browser always sends Origin on cross-origin requests; Fastify's inject does not add it by default. The test explicitly omits the Origin header, which works correctly with inject. No issue found but noted for completeness.
