# Story 6: Client-Side Router + Gating + Placeholder Routes

### Summary
<!-- Jira: Summary field -->

Install React Router 7 with a `defineRoute` registry, a `<RequireAuth>` guard, and empty `/home` and `/settings` gated placeholder routes. Unauthenticated navigation to any non-landing path redirects to landing.

### Description
<!-- Jira: Description field -->

**User Profile:** Streamer (or local visitor) who attempts to navigate directly to a gated surface before authenticating and gets bounced back to landing with a brief redirect flash.

**Objective:** Deliver the client-side gate. A single-source-of-truth route registry (`routes.ts`) is consumed by both the router and tests — inspecting the array is how TC-2.6a verifies `/home` and `/settings` are registered as gated. The `defineRoute({ path, name, element, gated })` factory wraps gated elements in `<RequireAuth>` automatically, so adding a new client route without gate-related code inherits the gate (mirroring Story 4's server-side achievement). In Epic 1, `<RequireAuth>`'s `isAuthenticated()` is hard-coded to `false`; Epic 2 replaces the function body to read a real session signal. A `*` catch-all path routes to a gated placeholder so unknown URLs also redirect to landing.

**Scope — In:**
- `react-router` 7 installed in `apps/panel/client`
- `src/app/defineRoute.ts` — factory returning a `RouteDefinition` with `toRouteObject()` that wraps `element` in `<RequireAuth>` when `gated: true`
- `src/app/routes.ts` — declarative array of routes: `/` (landing, not gated), `/home` (gated), `/settings` (gated), `*` (gated catch-all pointing to `HomePlaceholder`)
- `src/app/router.tsx` — `createBrowserRouter(routes.map(r => r.toRouteObject()))`
- `src/app/RequireAuth.tsx` — reads `useLocation()`, checks `isAuthenticated()` (hard-coded `false` in Epic 1), returns `<Navigate to="/" state={{ redirectedFrom: location.pathname }} replace />` on unauth
- `src/views/HomePlaceholder.tsx` + `src/views/SettingsPlaceholder.tsx` — both return `null` (never actually rendered because the guard short-circuits)
- `RouterProvider` mounted from `App.tsx` inside `<PaletteProvider>`
- `<RedirectFlash />` (shipped in Story 5) now wires up against `location.state.redirectedFrom`

**Scope — Out:**
- Real `isAuthenticated()` body (Epic 2 reads a session-established signal)
- Authenticated content for `/home` and `/settings` (Epic 2 populates `/settings` with Reset; later epics populate `/home`)

**Dependencies:** Story 5 (renderer exists, landing view + `<RedirectFlash />` ship, `<PaletteProvider>` wraps the tree).

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

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

**AC-2.4:** The landing route is reachable without a session on both the client (renderer) and the server (no server-side content for it; landing is not served by Fastify).

- **TC-2.4a: Landing reachable unauthenticated**
  - Given: No session cookie is present
  - When: The user loads the landing route
  - Then: The landing view renders (not a redirect to a different URL, not a 401)

**AC-2.5 (client side — TC-2.5b):** The renderer's client-side routes follow the same default-gated pattern. Adding a new React route requires no gate-related code; gating is declared via the `defineRoute({ gated: true })` argument.

- **TC-2.5b: New client route inherits client-side gate (unit)**
  - Given: A new React route registered without gate-related code
  - When: A user navigates to it unauthenticated
  - Then: The user is redirected to landing

**AC-2.6:** The renderer registers `/home` and `/settings` as gated placeholder routes. Neither route renders feature content in Epic 1. Both redirect to landing when unauthenticated per AC-2.1.

- **TC-2.6a: /home and /settings are registered**
  - Given: The renderer's route configuration
  - When: A test reads the registered routes
  - Then: Both `/home` and `/settings` are present and marked gated

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**Client-side routes registered in Epic 1:**

| Client Route | Gated? | Content |
|--------------|--------|---------|
| `/` (landing) | No | Full landing view per AC-1.2 |
| `/home` | Yes | Empty placeholder |
| `/settings` | Yes | Empty placeholder |
| `*` (catch-all) | Yes | Points to `HomePlaceholder`; triggers redirect to landing |

**`defineRoute({ path, name, element, gated }) → RouteDefinition`:**

The returned object exposes:
- `path`, `name`, `element`, `gated` — for test inspection (TC-2.6a reads `routes.find(r => r.name === 'home')?.gated`)
- `toRouteObject()` — returns `{ path, element: gated ? <RequireAuth>{element}</RequireAuth> : element }` for React Router

**`<RequireAuth>` Epic 1 body:**

```
function isAuthenticated(): boolean {
  return false; // Epic 2 replaces with a hook reading a "session established" signal
}
```

On unauthenticated, returns `<Navigate to="/" state={{ redirectedFrom: location.pathname }} replace />`. The `replace` verb prevents bloating browser history with bounced paths.

**Redirect flash integration:** `<RedirectFlash />` (shipped in Story 5) reads `useLocation().state?.redirectedFrom`. The flash auto-clears after 2.4s via a `setTimeout` that calls `window.history.replaceState` to null out the state.

**Test file for this story:** `client/src/app/router.test.tsx` — 5 tests (TC-2.1a, TC-2.1b, TC-2.1c, TC-2.5b, TC-2.6a).

**TC-2.4a coverage note:** Epic's Story Breakdown assigns AC-2.4 to Story 6, and the coverage gate follows suit. The TC's test assertion, however, lives in Story 5's `Landing.test.tsx` per the test plan — rendering `<Landing />` inside `<MemoryRouter>` at `/` and asserting no redirect is the test-plan's realization of "landing reachable unauthenticated." Story 6's router.test.tsx covers TC-2.1a/b/c (the bounce paths) which collectively also prove that `/` *does not* bounce (by implication — if any route could bounce `/`, the router setup would be broken and all 2.1 tests would fail). No duplicate test added here; the AC delivers in Story 6 because the router + guard that could have broken landing reachability ship in Story 6, but the assertion runs in Story 5's file.

See [`../tech-design-client.md`](../tech-design-client.md) §Router, §Route Registry and Gating, §RequireAuth Guard for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] `react-router` 7 installed and `createBrowserRouter` wired from `App.tsx`
- [ ] `routes.ts` exports an array inspectable by tests; `/home` and `/settings` entries have `gated: true`; `/` has `gated: false`; `*` catch-all present and gated
- [ ] `<RequireAuth>` redirects with `state.redirectedFrom` set to the attempted path
- [ ] `<RedirectFlash />` displays the redirected-from path and auto-dismisses after 2.4s
- [ ] Placeholder views return `null` (unreachable in Epic 1)
- [ ] 5 tests pass in `client/src/app/router.test.tsx`
- [ ] `pnpm verify` passes
