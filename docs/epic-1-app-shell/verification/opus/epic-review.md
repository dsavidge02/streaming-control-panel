# Epic 1 — Opus Reviewer Report

**Reviewer:** `opus-reviewer` (Claude Opus 4.7 · 1M context)
**Date:** 2026-04-18
**Scope:** Epic-Level Verification of Epic 1 (App Shell & Landing) on `main` @ `6df71f8`
**Counterparts:** `sonnet-reviewer`, `gpt54-reviewer`, `gpt53-codex-reviewer`

---

## Executive summary

Epic 1 lands. All 38 ACs and 54 TCs are mapped to an implementing surface; 77 Vitest
tests + 17 Playwright baselines + 1 `smoke:packaged` boot gate are green on `main`
per the team-impl-log. Every directly streamer-visible AC (landing content, sign-in
click → typed error envelope, redirect-to-landing for gated routes, packaged
artifact boots to landing) has real evidence — not a stub, not a placeholder. The
substrate (central registrar, Origin/session pre-handler ordering, typed error
envelope with central error handler, data-layer bootstrap, `app://panel` protocol,
packaging pipeline) is coherent and ready to be inherited by Epic 2+.

Concerns are concentrated in three areas and are **not ship-blocking** for Epic 1
itself: (1) the heartbeat-cadence test (`TC-6.3a`) does not actually exercise the
15-second interval because the test-only `timerMode:"fake"` branch ends the
response after the initial on-connect heartbeat; (2) several docs (notably `CLAUDE.md`
and `tech-design-server.md` interface blocks) are stale relative to the implemented
code; (3) some Story 8 workarounds (root-level runtime deps, redundant asarUnpack
entries) are still present after hoisting and should be revisited before Epic 2.

**Ship-readiness grade: B+.** All ACs are demonstrably covered, the trust-boundary
and error-model primitives are correctly wired, and the packaging defects exposed
during Story 8 are properly captured in `decisions-log.md` with `smoke:packaged`
now guarding regressions. The test-quality gap on SSE cadence and the doc drift
keep this out of the A band.

---

## Critical findings

None. No ship-blocking defects identified.

Candidates considered and rejected:

- **SSE cadence not actually tested** — promoted to **Major** rather than Critical.
  The interval behavior is verified by observed-run human verification only; the
  code path is simple (a `setInterval` with a fixed 15-second delay) and
  independently reviewed. Ships, but needs a real test in Epic 4a when real
  producers use the transport.
- **PATHS shape drift from tech-design-server.md interface block** — Minor. The
  implementation chose the nested `live: { events: '/live/events' }` shape (used
  consistently everywhere) over the spec's flat `liveEvents: '/live/events'`. No
  behavior gap; just a doc-drift item.

---

## Major findings

### M1 — `TC-6.3a` does not verify heartbeat cadence

**Affected:** `apps/panel/server/src/routes/liveEvents.ts:29-32` +
`apps/panel/server/src/test/buildTestServer.ts:12` +
`apps/panel/server/src/routes/liveEvents.test.ts:27-57`

**Evidence:** `buildTestServer` defaults `timerMode: "fake"`. The liveEvents
handler, when `timerMode === "fake"`, emits **one** heartbeat and immediately calls
`reply.raw.end()` — the `setInterval` never runs. The cadence test then does
`vi.advanceTimersByTimeAsync(30_000)` and asserts `response.body.toContain("event:
heartbeat")`. That assertion is satisfied by the single initial-on-connect
emission; no interval emission is ever exercised. The `HEARTBEAT_INTERVAL_MS =
15_000` constant is unreachable in test.

**Spec reference:** Epic AC-6.3 ("at least once every 30 seconds while a subscriber
is connected"); test-plan TC-6.3a explicitly promises "at least one heartbeat
within 30s simulated time" with fake timers advancing.

**Suggested fix:** Replace the fake-timer shortcut with a genuine `vi.useFakeTimers`
+ `reply.inject`-style test that captures stream chunks across advanced time, or
expose the handler's interval as a testable unit (inject the interval function as
a dependency). Alternatively, add an observed-run item to the Story 7/8 README
checklist ("connect to `/live/events` with a valid fixture cookie, wait 30s, see
≥2 heartbeats"). At minimum, the current test should be renamed so its intent
isn't misread ("initial heartbeat on connect" rather than "cadence").

### M2 — Documentation drift on `CLAUDE.md`

**Affected:** `CLAUDE.md:7` and `CLAUDE.md:57-59`

**Evidence:**
- Line 7: "No code is implemented yet — the repo is currently at Epic 1 Story 0
  scaffolding."
- Lines 57-59: "Story 0 ... and Story 1 ... are accepted and committed; cumulative
  test count is 11 ... `docs/epic-1-app-shell/RESTART-INSTRUCTIONS.md` is stale."

Both statements are wrong on `main`. Epic 1 is complete; test count is 77 + 17 +
1. Future agents reading `CLAUDE.md` first (as the file itself instructs) will
start from an incorrect current-state model.

**Spec reference:** Team-impl-log state block explicitly tracks "Current state"
as `PRE_EPIC_VERIFY`; `CLAUDE.md` should roll forward when epic state advances.

**Suggested fix:** Update §"Current state — before starting work" to reflect Epic
1 complete + cumulative counts + call out Epic 2 as the next workstream. Delete
the stale `RESTART-INSTRUCTIONS.md` reference (or the file itself).

### M3 — `tech-design-server.md` §Interface Definitions block diverges from implementation

**Affected:** `docs/epic-1-app-shell/tech-design-server.md:1224-1232` vs
`apps/panel/shared/src/http/paths.ts:1-5`

**Evidence:** Spec shows:
```ts
export const PATHS = {
  auth: { login: '/auth/login' },
  oauth: { callback: '/oauth/callback' },
  liveEvents: '/live/events',
} as const;
```
Implementation uses `live: { events: '/live/events' }` (nested), consistent
across every consumer (`server/routes/liveEvents.ts`, test files,
`shared/index.ts`). The decisions-log does not mention this shape change;
downstream epics will consume the spec block and hit a mismatch.

**Additional drift in the same companion:**
- `tech-design-server.md:87-92` references a `scripts/test-e2e-placeholder.mjs`
  that no longer exists (replaced by the real Playwright script in Story 5).
- `tech-design-server.md:314-318` still lists `asarUnpack:
  "node_modules/better-sqlite3/**/*"` which Decision #6 in `decisions-log.md`
  flagged as dead under pnpm. The live `electron-builder.yml` keeps it "as
  defense," which is a defensible choice, but the spec and live config should
  agree.

**Suggested fix:** Either update the server companion to the implemented shapes
(preferred — companions are prescriptive, and Decision #1 etc. already reflect
similar fold-backs) or add explicit "the shape in implementation deviates from
this block; see decisions-log" pointers. This is the kind of drift that's cheap
to clean up now and expensive to untangle in Epic 2 when the first fresh story
reads these blocks cold.

### M4 — Root `package.json` retains Story 8 pnpm-symlink workaround dependencies

**Affected:** `package.json:39-54`

**Evidence:** `decisions-log.md` Decision #9 explicitly says: "Fix round 1 added 7
runtime deps … to root `package.json` so electron-builder's workspace traversal
found them. This was a pnpm-symlink workaround. Under `node-linker=hoisted`
(Decision #1), these should be removable." The hoisted linker is in place
(`.npmrc` line 2). Root runtime deps (`better-sqlite3`, `fastify`,
`@fastify/cookie`, `fastify-type-provider-zod`, `drizzle-orm`, `iron-session`,
`zod`, plus transitive add-ons) are still declared at the root. This is a
documented TODO, not a defect, but it muddies the workspace contract — the root
is not actually a runtime package and should not be declaring runtime deps.

**Spec reference:** Architecture's pnpm-configuration subsection cites
`node-linker=hoisted` as the canonical solution; the root deps were the
mitigation for the broken pre-hoisted state.

**Suggested fix:** Attempt removal on a throwaway branch; run `pnpm install && pnpm
package && pnpm smoke:packaged`. If green, land the cleanup before Epic 2 Story 0
so `install_binding` + `tokens` don't inherit the pattern. If the packaged
artifact regresses without the root deps, keep them but annotate them inline
referencing Decision #9 + explaining why hoisting wasn't sufficient on the
current host.

### M5 — NavBar's "PLAY"/"OPTIONS" click does not navigate the router

**Affected:** `apps/panel/client/src/components/NavBar.tsx:40-48`

**Evidence:** `NavBar` tab buttons call `onGatedNavigate(tab.path)` to set
local state for the redirect flash. They do **not** issue a `navigate(tab.path)`
— URL never changes. The ui-spec §NavBar says: "Inactive gated (PLAY/OPTIONS):
triggers `<RedirectFlash>` via React Router state, then navigates to `/`." The
implementation simulates the bounced-back experience without actually touching
the router. Direct URL navigation (address-bar `/home`) works correctly via
`RequireAuth` → `Navigate to="/"` + `RedirectFlash`'s `RouterRedirectFlash` arm.

**Impact:** The demo value of the landing's NavBar is reduced — clicking PLAY
doesn't teach the user anything about the gate. AC-2.1 is still satisfied because
its TCs test URL navigation (TC-2.1a/b/c), not NavBar clicks.

**Suggested fix:** Dispatch `useNavigate()(tab.path)` on the click and let
`RequireAuth`/`<Navigate>` produce the redirect. Alternatively, update the
ui-spec §NavBar to describe the current simulation-only behavior so spec and
code match. Cheap to align either direction; worth doing before Epic 2's
settings tab lights up.

---

## Minor findings

### m1 — `buildServer.test.ts:13-33` second test is tautological

Test "app.listen receives host and port from resolved config" calls `listen`
manually with `{ host: config.host, port: config.port }` and asserts the spy saw
those exact values. That proves the test supplies what it supplies, not that
`startServer` wires `loadConfig()` into `listen`. Replace by spying on `listen`
and then calling `startServer()` itself (stub the real bind).

### m2 — Root `package.json` missing `build` script from tech-design

The spec lists `"build": "electron-vite build && pnpm --filter client build"`.
The implementation's `package` script is end-to-end so `build` is redundant; the
spec entry should be pruned or the root script added for parity with the spec
companion.

### m3 — `SignInProvider` was introduced without being in the tech-design

`tech-design-client.md` §Sign-In Handler specifies `useSignIn()` returning
local-state bits; implementation added a `SignInProvider` + `useSignIn` context
pattern. This is a defensible choice (HUD panels and the button share state), but
the client companion never mentions a provider. Either update the spec or note
the deviation in the decisions-log.

### m4 — `Landing` uses local `useState(redirectedFrom)` + `NavBar` prop plumbing

`Landing.tsx:25` and its prop threading into `NavBar` + `RedirectFlash` routes the
flash via component state instead of React Router's `location.state`.
`RedirectFlash` has a `RouterRedirectFlash` arm that does read `location.state` —
so URL-driven redirects work — but the NavBar-driven flow bypasses the router.
Related to M5; the same fix resolves both.

### m5 — `fetchClient.resolveServerUrl` hardcodes `http://localhost:7077`

Works correctly in both dev and production (Origin allowlist accepts
`app://panel` → `localhost:7077` cross-origin fetch), but a future `PANEL_PORT`
override story (Open Question Q1) will need to thread this value. The spec at
`tech-design-client.md:795` already notes the decision; track for Epic 2+ if
port override ever ships.

### m6 — `dev.ts` entry point is not tested

`apps/panel/server/src/dev.ts` is a 3-line module consumed by `pnpm --filter
@panel/server dev`. Observed-run item only (TC-3.4a/b exercise route behavior
but not the entry). Low risk because the module only re-calls `startServer`.

### m7 — `scripts/smoke-packaged.mjs` uses `SMOKE_MODE=1` env var but main process doesn't read it

The smoke script sets `env: { SMOKE_MODE: "1" }` (line 11) and the decisions-log
mentions "`SMOKE_MODE=1` env var main reads and `app.quit(0)`s after
`did-finish-load`." The actual `apps/panel/server/src/index.ts` has no such
check; the smoke script instead relies on the 30-second deadline + `taskkill`
to shut the process down. The env var is a no-op. Decisions-log description is
aspirational vs the shipped code; prune or wire up.

### m8 — `Marquee` `aria-hidden="true"` on the animated banner — correct, but `prefers-reduced-motion` not implemented

ui-spec §8 UQ4 says: "marquee freezes at 0% position; scanlines remain (static);
hover translations remain." Search of `apps/panel/client/src/**` for
`prefers-reduced-motion` returns no matches. Low severity because the marquee
is decorative (`aria-hidden`), but the spec commitment is unfulfilled.

### m9 — `HomePlaceholder`/`SettingsPlaceholder` return `null`

Correct per spec; worth noting that `routes.ts` registers the `*` catch-all also
pointing at `<HomePlaceholder />` wrapped in `RequireAuth`, which means the user
bounces to `/` for any unknown gated path (correct behavior). One-line
explanatory comment on `routes.ts:28-32` describing the intent would help the
next person reading it.

### m10 — `baseSseEventSchema` in `shared/sse/events.ts` is unused

`apps/panel/shared/src/sse/events.ts:3-6` defines and exports `baseSseEventSchema`
that no one consumes (server writes literal strings; client tests parse against
`heartbeatEventSchema`). Dead export. Candidate for pruning before Epic 4a adds
real events.

### m11 — Log secret values

`apps/panel/server/src/server/config.ts:49` returns a literal fallback
`'dev-only-change-in-epic-2-___________'`. If logging of `req.server.config` is
ever added during Epic 2+ debugging, the secret leaks. Consider either using
`Symbol` or a getter that redacts under `toJSON`. Low risk in Epic 1 because no
cookie is issued.

### m12 — `RedirectFlash` has a 2400ms auto-dismiss timer that `useEffect` cleans up on unmount but doesn't clear on prop change

`RedirectFlash.tsx:19-29` — if `redirectedFrom` changes while a timer is
active, the old timer fires (calls `setVisible(false)` + `onDismiss`). The `key`
prop on the outer `Flash` component forces remount-on-new-path which resets the
timer, so practically this is fine. Callout only.

### m13 — Test plan reconciliation off by one file

`test-plan.md:604` lists 22 test files summing to 92 tests (75 Vitest + 17
Playwright). The implementation has 20 Vitest files under `apps/panel/` summing
to 75 + a separate `tools/ci/workflow.test.ts` of 2 tests = 77 Vitest. The
test-plan's per-file table does not include the CI-tools file; it's counted in
Chunk 9 delivery but not in the per-file matrix. Add the tools/ci row to
reconcile.

---

## Coverage verification

### AC coverage — full matrix

All 38 ACs ownership is mapped in `stories/coverage.md` and verified against code:

| AC | Primary surface | Verification |
|----|-----------------|--------------|
| AC-1.1 | `server/electron/{app,window}.ts` + `index.ts` | TC-1.1a/b observed-run + `smoke:packaged` automated |
| AC-1.2 | `client/views/Landing.tsx` + `client/components/{Hero,CapabilityGrid}.tsx` | `Landing.test.tsx` TC-1.2a live |
| AC-1.3 | `client/components/SignInButton.tsx` + `client/hooks/useSignIn.ts` + `client/api/authApi.ts` | `SignInButton.test.tsx` TC-1.3a/b/c live |
| AC-1.4 | `Landing.tsx` (no mount-time fetch) | `Landing.test.tsx` TC-1.4b live |
| AC-2.1 | `client/app/RequireAuth.tsx` + `routes.ts` | `router.test.tsx` TC-2.1a/b/c live |
| AC-2.2 | `server/gate/sessionPreHandler.ts` | `liveEvents.test.ts` TC-2.2a live |
| AC-2.3 | `shared/http/gateExempt.ts` + `registerRoute.ts` safety check | `gateExempt.test.ts` TC-2.3a + `oauthCallback.test.ts` TC-2.3b + `auth.test.ts` TC-2.3c |
| AC-2.4 | `routes.ts` (landing gated:false) | `Landing.test.tsx` TC-2.4a + `router.test.tsx` implicit |
| AC-2.5 | `registerRoute.ts` + `defineRoute.ts` | `registerRoute.test.ts` TC-2.5a + `router.test.tsx` TC-2.5b |
| AC-2.6 | `routes.ts` | `router.test.tsx` TC-2.6a |
| AC-3.1 | `package.json#start` + `electron.vite.config.ts` | Observed-run |
| AC-3.2 | `electron.vite.config.ts` renderer HMR | Observed-run |
| AC-3.3 | `client/vite.config.ts` | Observed-run |
| AC-3.4 | `server/src/dev.ts` + stub routes | `oauthCallback.test.ts` TC-3.4a + `liveEvents.test.ts` TC-3.4b |
| AC-3.5 | `README.md` + `readme.test.ts` | `readme.test.ts` live |
| AC-4.1/2/3 | `electron-builder.yml` + `scripts/smoke-packaged.mjs` + `readme-package.test.ts` | Observed-run + `smoke:packaged` + `readme-package.test.ts` |
| AC-5.1–5 | `.github/workflows/ci.yml` + `tools/ci/workflow.test.ts` | Observed (PR #1) + `workflow.test.ts` |
| AC-6.1 | `routes/oauthCallback.ts` | `oauthCallback.test.ts` TC-6.1a |
| AC-6.2 | `routes/auth.ts` | `auth.test.ts` TC-6.2a/b |
| AC-6.3 | `routes/liveEvents.ts` | `liveEvents.test.ts` TC-6.3a/b — **see M1: cadence test weak** |
| AC-6.4 | `shared/sse/events.ts` + handler emission | `liveEvents.test.ts` TC-6.4a |
| AC-7.1 | `server/server/config.ts` | `buildServer.test.ts` TC-7.1a |
| AC-7.2 | `gate/originPreHandler.ts` | `originPreHandler.test.ts` TC-7.2a/b |
| AC-7.3 | preHandler ordering in `registerRoute.ts` | `oauthCallback.test.ts` TC-7.3a |
| AC-7.4 | `registerRoute.ts` preHandler array order | `originPreHandler.test.ts` TC-7.4a |
| AC-8.1 | `errorHandler.ts` | Across `liveEvents.test.ts` TC-8.1a, `originPreHandler.test.ts` TC-8.1b, `auth.test.ts` TC-8.1c, `errorHandler.test.ts` TC-8.1d |
| AC-8.2 | `errorHandler.ts` | `errorHandler.test.ts` TC-8.2a |
| AC-8.3 | `shared/errors/codes.ts` | `codes.test.ts` TC-8.3a |
| AC-9.1/2/4 | `server/data/{db,schema}.ts` + `drizzle/0001_install_metadata.sql` | `db.test.ts` TC-9.1a/b, TC-9.2a/b, TC-9.4a/b |
| AC-9.3 | `package.json#rebuild:electron` + `@electron/rebuild` | Observed-run (first `pnpm start` on host OS) |

**All 38 ACs have at least one verification surface.**

### TC coverage

All 54 TCs accounted for; 16 observed-run TCs explicitly documented in
`test-plan.md` §Observed-Run Checklist (TC-1.1a, TC-1.1b, TC-1.4a, TC-3.1a,
TC-3.2a, TC-3.3a, TC-4.1a, TC-4.2a, TC-5.1a, TC-5.2a–d, TC-5.5a, TC-5.5b,
TC-9.3a). 38 automated. Count reconciles with coverage.md §Coverage Summary.

One caveat: TC-6.3a is **formally present** but **operationally weak** per M1 —
the test passes without exercising the cadence code path.

### Stories 0–9 DoD satisfaction

| Story | DoD claimed | Evidence on `main` | Verdict |
|-------|-------------|---------------------|---------|
| 0 | Workspace, Biome, TS, Vitest, empty AppError + registry | All four packages present; `codes.ts` live; 3 shared tests | ✓ |
| 1 | Fastify on 127.0.0.1:7077 via central registrar, central error handler | `buildServer.ts`, `registerRoute.ts`, `errorHandler.ts` live; 8 tests | ✓ |
| 2 | `/auth/login`, `/oauth/callback`, `/live/events` heartbeat | All 3 handlers live; SSE envelope shared | ✓ (see M1 caveat) |
| 3 | SQLite + Drizzle + baseline migration | `db.ts` + `0001_install_metadata.sql` + 8 tests | ✓ |
| 4 | Default-gated preHandler + Origin preHandler + iron-session stub-replacement | `originPreHandler.ts`, `sessionPreHandler.ts`, `sealFixtureSession.ts` live; 8 new + 11 un-skipped | ✓ |
| 5 | React 19 + Vite 8 + landing + 5-palette switcher + testBypass + 17 Playwright | All components present; 17 baseline PNGs in `__screenshots__/`; `testBypass.ts` + test live | ✓ |
| 6 | Router + gating + placeholders | `defineRoute.ts`, `RequireAuth.tsx`, `routes.ts`; 5 tests | ✓ |
| 7 | Electron shell + `app://` protocol + `pnpm start` + HMR + README dev-mode table | `electron/app.ts`, `electron/window.ts`, `electron.vite.config.ts`, README §Dev modes | ✓ |
| 8 | `electron-builder.yml` + `pnpm package` + host-OS artifact + `smoke:packaged` | All present; 11 decisions logged | ✓ |
| 9 | `.github/workflows/ci.yml` + `tools/ci/workflow.test.ts` | Both live, merged via PR #1 | ✓ |

No story is incomplete on `main`.

---

## Interface + architecture alignment

### Aligned (strong)

- **Error model end-to-end:** Server `AppError.throw` → `setErrorHandler` →
  `{ error: { code, message } }` envelope → renderer `errorEnvelopeSchema.safeParse`
  → `ApiResult` → `messageFor(code, …)` → `ErrorEnvelopeCard`. All five registered
  codes (`AUTH_REQUIRED`, `ORIGIN_REJECTED`, `INPUT_INVALID`, `NOT_IMPLEMENTED`,
  `SERVER_ERROR`) have a consistent path from throw site to UI.
- **preHandler ordering:** `registerRoute.ts:44-48` composes
  `[origin?, session?, ...custom]` — matches tech-design D5 and AC-7.4. TC-7.4a
  passes because of this order.
- **Exempt-list safety:** `registerRoute.ts:26-34` catches `exempt:true` without
  the path in `GATE_EXEMPT_PATHS` at registration time. Matches tech-design §Why
  a Helper and Not a Plugin.
- **Data-layer bootstrap:** Migrations run synchronously during `buildServer`
  before Fastify accepts requests. `TC-9.2a` verifies via buildTestServer.
- **Origin allowlist:** `http://localhost:5173`, `http://127.0.0.1:5173`,
  `app://panel` — matches D3 exactly. `resolveAllowedOrigins()` frozen as a
  literal tuple, not env-driven.
- **Packaging chain:** `.npmrc` hoisted linker + `scripts/package-and-restore-native.mjs`
  + explicit `rebuild:electron` + `electron-builder.yml` with
  `asarUnpack: **/*.node` + `smoke:packaged` gate. The research in
  `decisions-log.md` #1–#6 drove these choices; code matches the doc.

### Drift (documented in Major/Minor)

- **`PATHS` shape** — M3 (nested `live.events` vs flat `liveEvents`).
- **`SignInProvider`** — m3 (context pattern added beyond the tech-design).
- **`NavBar` click-behavior** — M5 + m4 (ui-spec says navigate + flash; impl
  simulates).
- **Stale snippets in tech-design-server.md §Packaging** — M3b (dead asarUnpack
  entry, missing rebuild:electron flow, stale test-e2e-placeholder).
- **`CLAUDE.md` current-state block stale** — M2.

### Cross-cutting patterns verified consistent

- **Error envelope shape** verified identical at every throw site and at the
  central handler. No route handler serializes its own errors.
- **`registerRoute` usage** uniform: every route file imports and calls
  `registerRoute(app, spec)` — no `app.get`/`app.post` slipped into
  production routes. Test routes (`errorHandler.test.ts`) correctly use raw
  `app.get(...)` only to bypass the registrar intentionally.
- **Palette CSS-var injection** centralized in `PaletteProvider.tsx`; every
  component reads `var(--panel-*)`.
- **Font loading** self-hosted in `apps/panel/client/public/fonts/` with
  `@font-face` + `font-display: swap` + `local(...)` fallback. No Google CDN in
  `index.html`. Matches Story 5 fix-round-1 remediation.

---

## Test quality assessment

**Counts:** 77 Vitest (4 shared + 2 tools/ci + 39 server + 32 client) + 17
Playwright baseline PNGs + 1 `smoke:packaged` gate. Per the team-impl-log state
block this matches `main`.

Verified by direct grep:
- `apps/panel/**/*.test.{ts,tsx}`: 75 `test(...)` / `it(...)` blocks across 20 files.
- `tools/ci/**/*.test.ts`: 2 blocks.
- `apps/panel/client/tests/e2e/landing.spec.ts`: 9 `test(...)` statements, two
  of which iterate over the 5-palette array → **17 concrete tests**. Baseline
  PNGs present for every one: 17 files in `__screenshots__/`. ✓

### Strengths

- Service-mock-first approach is honored. `app.inject()` used for every HTTP
  test; no mocking of `registerRoute`, preHandlers, or the error handler.
- Only one module mocked in renderer tests (`@/api/authApi`). The hook,
  fetchClient, and React Router are all real. Matches the test plan's §Mock
  Strategy commentary.
- Baselines regenerated with `fullPage: true` after the Story 5 human visual
  review — matches v2-findings/010 commitment. Responsive 960×600 baseline
  present.
- `sealFixtureSession` helper lets positive-path session tests ship in
  `sessionPreHandler.test.ts` today without inventing the session-seal pattern
  in Epic 2.
- `testBypass.ts` production-safety strip via `import.meta.env.DEV` is
  verified by the `testBypass.test.ts:12-18` disabled-path assertion.

### Weaknesses

- **M1 — cadence test tautology** (see Major findings).
- **m1 — `buildServer.test.ts:13-33` tautology** (see Minor).
- **TC-9.2a is implicit**: "migrations run before HTTP is served" is proved only
  by the install_metadata row existing after `buildTestServer()` resolves.
  A stronger version would register a route that queries install_metadata and
  verify its handler returns the row even on the first request — ties migrations
  explicitly to a served HTTP response.
- **`router.test.tsx` TC-2.1a/b/c use `findByRole('button', { name: 'Sign in
  with Twitch' })`** to confirm landing renders. This couples gate-behavior
  tests to the `<SignInButton>` existing on landing. If Story 5's landing
  content ever drops the sign-in button, 3 unrelated tests fail with a
  confusing reason. A `data-testid="landing-root"` assert (already on
  `Landing.tsx`) would be more robust.

### Baseline image set integrity

17 PNGs with stable naming (`landing-<state>-<palette>.png` plus the responsive
suffix). Matches ui-spec §Verification Surface exactly:
- 5 × `landing.default.{palette}` ✓
- 5 × `landing.sign-in-error-501.{palette}` ✓
- 1 × sign-in-pending, sign-in-error-403, sign-in-error-500, redirect-home,
  redirect-settings, palette-switcher-open — 6 × amber ✓
- 1 × responsive 960×600 amber ✓

No visual diff review performed in this report (bandwidth — deferred to the
Sonnet reviewer's visual pass per the orchestration memo). File presence
confirmed; file sizes look reasonable for fullPage captures.

---

## Boundary inventory audit

Reconciling team-impl-log §Boundary Inventory against code on `main`:

| Boundary | Log status | Actual | Notes |
|----------|-----------|--------|-------|
| Twitch OAuth (`/auth/login`) | **stub** | Stub confirmed — `routes/auth.ts:10-15` throws `NOT_IMPLEMENTED` | Matches |
| Twitch OAuth callback (`/oauth/callback`) | **stub** | Stub confirmed — `routes/oauthCallback.ts:10-14` | Matches |
| Twitch Helix / EventSub | not started | No Helix client, no EventSub subscription anywhere | Matches |
| OS keychain (keytar) | not started | No keytar dep, no secret persistence | Matches |
| SQLite filesystem (userData) | integrated | `data/db.ts` + `drizzle/0001_*` + `config.resolveUserDataDbPath` | Matches |
| Live SSE producers | **stub** (heartbeat) | `routes/liveEvents.ts` emits only heartbeat; interval fires in real mode only | Matches (see M1) |
| Electron shell | integrated | `electron/app.ts` + `electron/window.ts` + `index.ts` | Matches |
| GitHub Actions CI | integrated (post Story 9) | `.github/workflows/ci.yml` live + merged via PR #1 | Matches |
| Session cookies (iron-session) | not started (gate installed) | `sessionPreHandler.ts` reads + `unsealData`; no route ever calls `sealData` in Epic 1 | Matches |

**No unexpected stubs.** Every boundary-level stub is intentional and
accompanied by a downstream-epic owner.

### `smoke:packaged` gate — is it real?

Yes. `scripts/smoke-packaged.mjs` spawns `dist/packaged/win-unpacked/Streaming
Control Panel.exe`, polls `POST http://127.0.0.1:7077/auth/login` with
`Origin: app://panel` until it receives a 501 `NOT_IMPLEMENTED` envelope,
times out at 30s, and taskkill's the process. This is a genuine boot
verification:

- Proves the packaged artifact starts Electron main.
- Proves Fastify binds 127.0.0.1:7077.
- Proves migrations ran (bind happens after `applyMigrations`).
- Proves the central error handler + AppError pipeline works end-to-end.
- Proves the Origin allowlist accepts `app://panel`.
- Proves the asarUnpack + drizzle + better-sqlite3 binding survived packaging.

The only thing it does not exercise is the renderer actually loading the UI.
That remains observed-run (TC-4.2a human check). Decisions-log #4 correctly
documents this scope boundary. m7 (SMOKE_MODE env var unused by main) is a
minor cleanup item; the gate is functional without it.

---

## UI spec compliance

### Component naming + identity match

Every ui-spec §7 component has a corresponding file with the expected name:

| ui-spec name | File | Matches |
|--------------|------|---------|
| `<Marquee />` | `client/src/components/Marquee.tsx` | ✓ |
| `<NavBar />` | `client/src/components/NavBar.tsx` | ✓ |
| `<RedirectFlash />` | `client/src/components/RedirectFlash.tsx` | ✓ |
| `<Hero />` | `client/src/components/Hero.tsx` | ✓ |
| `<SignInButton />` | `client/src/components/SignInButton.tsx` | ✓ |
| `<ErrorEnvelopeCard />` | `client/src/components/ErrorEnvelopeCard.tsx` | ✓ |
| `<SystemStatusPanel />` | `client/src/components/SystemStatusPanel.tsx` | ✓ |
| `<ErrorRegistryPanel />` | `client/src/components/ErrorRegistryPanel.tsx` | ✓ |
| `<CapabilityGrid />` | `client/src/components/CapabilityGrid.tsx` | ✓ |
| `<Footer />` | `client/src/components/Footer.tsx` | ✓ |
| `<PaletteSwitcher />` | `client/src/palette/PaletteSwitcher.tsx` | ✓ |
| `<BackgroundLayers />` (implicit in `<Landing>`) | `Landing.tsx:14-22` | ✓ |

### Named-state coverage (ui-spec §6 for `landing` screen)

All named states in §6 have a Playwright baseline (verified by snapshot file
count + naming):

| State | Baseline | Palette variants |
|-------|----------|------------------|
| default | ✓ | all 5 |
| palette-switcher-collapsed | (implicit in default) | — |
| sign-in-pending | ✓ | 1 (amber) |
| sign-in-error-not-implemented | ✓ | all 5 |
| sign-in-error-origin | ✓ | 1 (amber) |
| sign-in-error-server | ✓ | 1 (amber) |
| redirect-flash-home | ✓ | 1 (amber) |
| redirect-flash-settings | ✓ | 1 (amber) |
| palette-switching (open) | ✓ | 1 (amber) |
| responsive 960×600 | ✓ | 1 (amber) |

17 baselines = 17 state/palette combos. Complete.

### Tech-design identifiers resolved

ui-spec §7 TD-identifier links all resolve to files that exist. No orphans.

### Cross-story visual consistency (static check)

- **Palette system uniform:** Every component reads `var(--panel-*)` — no
  hardcoded hex values leak from per-component styles into the palette
  contract. The `PaletteSwitcher` deliberately uses hardcoded `#0a0a0a`/`#e5e5e5`
  (the switcher is palette-agnostic study chrome per ui-spec §7 —
  "neutral-chrome pane that stays visually stable while the rest of the page
  re-tokenizes"). Matches D9 commentary.
- **Font loading uniform:** `fonts.css` loaded once from `main.tsx`; every
  component uses `fontFamily: "'Space Mono', monospace"` or `'Press Start
  2P', monospace` inline on the display-text elements. No alternative fonts
  sneak in.
- **Layout anchors consistent:** 12-column grid on `<main>`, 5-column grid on
  `<CapabilityGrid>` at `md`+, padding scale `px-5 sm:px-8 lg:px-10`. Spec and
  code agree.

### Missed from ui-spec

- m8 — `prefers-reduced-motion` CSS not implemented (ui-spec §8 UQ4 commitment).
- m4 — `RedirectFlash` consumption of React Router `location.state` is partial
  (see M5 discussion).

---

## Ship-readiness grade

**B+** — Epic 1 ships. The substrate every downstream epic inherits is coherent,
testable, and documented. The streamer-visible surface (landing view + sign-in
+ redirect flash + packaged boot) works end-to-end and has real evidence.
Packaging research (`.npmrc` hoisted linker, rebuild:electron, drizzle
`files:`, smoke gate) is a concrete asset for Epic 2+.

What keeps it out of A: the heartbeat cadence test doesn't actually verify
cadence (M1); CLAUDE.md misrepresents current state (M2); the tech-design
companion block on PATHS and the packaging §Native Rebuild Pipeline are stale
vs implementation (M3); Story 8 pnpm-symlink workarounds (root runtime deps)
outlived their necessity (M4); the NavBar demo doesn't actually navigate (M5).
None of those block Epic 2 from starting; all are cheap to clean up in a
pre-Epic-2 housekeeping pass and will compound if left alone.

**Verification commands the orchestrator should run to confirm acceptance:**

```sh
pnpm install
pnpm red-verify
pnpm verify
pnpm verify-all
pnpm package
pnpm smoke:packaged
```

Derived from `test-plan.md` and the team-impl-log state block. Passing all six
constitutes the epic-acceptance gate. The cadence-test weakness (M1) does not
produce a red verification — it produces a green test that isn't proving the
claimed behavior; no automated gate will catch this.

---

## What else did I notice but not fully investigate

1. **`HEARTBEAT_INTERVAL_MS = 15_000`** in real mode is currently unreachable
   by any automated test (M1 fallout). If the number drifts to 31_000, no gate
   catches it before observed-run.
2. **`resolveUserDataDbPath()` in pure-Node tests** falls back to
   `path.join(os.tmpdir(), "panel-dev.sqlite")` (config.ts:33). The fallback is
   never cleaned up — accumulates stale dev db files in `%TEMP%/`. Low severity
   but adds noise for future diagnostics. `buildTestServer` always uses
   `:memory:` so prod test-suite is unaffected; only stand-alone `pnpm --filter
   @panel/server dev` writes to the tmpdir path when Electron's `app.getPath`
   isn't available.
3. **`errorHandler.test.ts:12` `app.get('/test-throw-generic', ...)`** bypasses
   the central registrar to test the error handler directly. Intentional, but
   worth documenting that every error-handler test uses raw `app.get` while
   every route test uses `buildTestServer`/`registerRoute`.
4. **`shared/sse/events.ts:3-6` `baseSseEventSchema`** is exported but unused
   anywhere in the workspace (m10). Candidate to prune or annotate as "Epic 4a
   seam."
5. **`SignInButton.test.tsx:74-76` pending-state mock** returns
   `new Promise(() => {}) as ReturnType<typeof postAuthLogin>` — a forever-pending
   promise. Works for the assertion; if the `SignInProvider` state machine ever
   adds a timeout or an abort path, the test won't catch regressions.
6. **`registerRoute.test.ts:7-16`** uses `vi.mock` to wrap `originPreHandler`
   with `vi.fn(actual.originPreHandler)`. Works, but the test in lines 64-88
   then asserts `response.statusCode === 200` — which requires the actual
   `originPreHandler` to pass (the `Origin: 'app://panel'` matches the
   allowlist). The spy is used for call-counting only. Fine, but worth a comment
   explaining intent.
7. **`Landing.tsx:25` `useState<string | null>(null)`** for `redirectedFrom`
   is initialized fresh on every `<Landing>` mount. The `RouterRedirectFlash`
   arm reads `location.state` separately. The two sources can disagree
   momentarily during a React transition — not observable in Epic 1 because no
   state drives both simultaneously. Epic 2 (Reset action) will exercise this
   code path more heavily; worth keeping an eye on.
8. **`tools/ci/workflow.test.ts`** reads `.github/workflows/ci.yml` via
   `fileURLToPath(import.meta.url)` + relative path (`../..`). If the file is
   moved (unlikely but possible) both the test and the gate break silently.
   Consider a config constant or a path-resolution helper.
9. **No integration test exercises the full `POST /auth/login` → error envelope
   → renderer error card** end-to-end. Each layer is tested but the seam is
   only exercised by Playwright's `landing.sign-in-error-501` which uses
   `testBypass.ts` to force the renderer state — not by a real server round
   trip. TC-1.3c is satisfied by the renderer test mocking `postAuthLogin`.
   Epic 2 will need a story-level integration test; the scaffolding is there
   via `buildTestServer` + `renderWithRouter`.
10. **`scripts/codex/` harness** is production-scale code (outer-driver, prompt
    composer, retry/wall logic) but ships untested. Out of Epic 1 scope — flagged
    because the harness is now load-bearing for Epic 2+ implementation flow.
11. **Cookie secret fallback** (`config.ts:49`) is a padded literal with 35
    underscores. Works because iron-session requires ≥32 bytes; any developer
    who counts letters will find this slightly ugly. Cheap to generate a more
    obviously-dev literal like `"dev-0-do-not-ship-".padEnd(32, "X")` at
    module-load time, or to pull from `process.env.PANEL_COOKIE_SECRET` with
    a hard-fail in production (`app.isPackaged` gate).
12. **`braindump.md`** is untracked in the git status snapshot but not
    `.gitignore`d. If a developer stages everything with `git add .`, a private
    notes file ships. Low severity; add to `.gitignore` or document in CLAUDE.md.

---

## Related Documentation

- Epic: [`docs/epic-1-app-shell/epic.md`](../../epic.md)
- Index: [`docs/epic-1-app-shell/tech-design.md`](../../tech-design.md)
- Server companion: [`docs/epic-1-app-shell/tech-design-server.md`](../../tech-design-server.md)
- Client companion: [`docs/epic-1-app-shell/tech-design-client.md`](../../tech-design-client.md)
- Test plan: [`docs/epic-1-app-shell/test-plan.md`](../../test-plan.md)
- UI spec: [`docs/epic-1-app-shell/ui-spec.md`](../../ui-spec.md)
- Coverage: [`docs/epic-1-app-shell/stories/coverage.md`](../../stories/coverage.md)
- Decisions log: [`docs/epic-1-app-shell/stories/decisions-log.md`](../../stories/decisions-log.md)
- Team-impl log: [`docs/epic-1-app-shell/team-impl-log.md`](../../team-impl-log.md)
