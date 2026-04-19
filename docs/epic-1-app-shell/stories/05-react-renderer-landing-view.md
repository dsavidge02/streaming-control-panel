# Story 5: React Renderer + Landing View + Playwright

### Summary
<!-- Jira: Summary field -->

Ship the React 19 + Vite 8 renderer, the neo-arcade landing view with its 5-palette system and sign-in button, the renderer-only dev mode, the DEV-only `testBypass` state-forcing surface, and the Playwright harness with 17 baseline screenshots.

### Description
<!-- Jira: Description field -->

**User Profile:** Streamer opens the landing view and sees the product description, the 5-item capability list, and the "Sign in with Twitch" button. Developer runs `pnpm --filter client dev` to iterate on the renderer without Electron.

**Objective:** Deliver the entire streamer-visible surface of Epic 1. Landing view composes 8 neo-arcade components (Marquee, NavBar, Hero, SystemStatusPanel, ErrorRegistryPanel, CapabilityGrid, Footer, PaletteSwitcher) on top of CSS-variable tokens installed by `<PaletteProvider>`. Sign-in button calls `POST /auth/login` via a typed fetch wrapper and surfaces the returned error code using an error-code-first switch (tech design D6). All 5 palettes ship; preference persists in `localStorage` (tech design D9). `testBypass.ts` is a DEV-only query-flag parser that forces named states for Playwright screenshot capture; it is dead-code-eliminated in production via `import.meta.env.DEV`. Playwright harness and 17 baseline screenshots land here — `test:e2e` flips from the Story 0 placeholder to `playwright test`.

**Scope — In:**
- React 19 + Vite 8 + Tailwind CSS 4.1 (Oxide, `@tailwindcss/vite` plugin) + shadcn/ui plumbing (no components copied in Epic 1)
- `apps/panel/client/vite.config.ts` — standalone Vite config for `pnpm --filter client dev` at `http://localhost:5173` with `strictPort: true`
- `apps/panel/client/src/main.tsx` + `App.tsx` + `index.html`
- `src/palette/palettes.ts` — 5 palette token definitions (Neon Night, Amber CRT, Cream Soda, Pocket Monochrome, Signal Beacon) lifted verbatim from `docs/references/neo_arcade_palettes.jsx`; default `amber`
- `src/palette/PaletteProvider.tsx` + `usePalette()` + `PaletteSwitcher.tsx` + `persistence.ts` — CSS-var injection on `:root`, localStorage-backed preference, `paletteApi.ts` no-op stubs for future server-backed persistence
- `src/styles/globals.css` — Tailwind entry + fallback CSS vars for pre-hydration state
- `src/styles/fonts.css` + self-hosted `public/fonts/` — Press Start 2P, Space Mono
- `src/views/Landing.tsx` — composition per `ui-spec.md` §7 with `<BackgroundLayers />`, marquee, nav, redirect flash, hero + HUD stack, capability grid, footer, palette switcher
- `src/components/`: `Marquee`, `NavBar`, `Hero`, `SystemStatusPanel`, `ErrorRegistryPanel`, `CapabilityGrid`, `Footer`, `RedirectFlash`, `SignInButton`, `ErrorEnvelopeCard`
- `src/hooks/useSignIn.ts` — `{ state, code, message, trigger, reset }`; error-code-first switch for rendering user-visible text per code
- `src/api/fetchClient.ts` — typed fetch wrapper, envelope parsing, `credentials: 'include'`, synthesizes `SERVER_ERROR` on network failure
- `src/api/authApi.ts` — `postAuthLogin()` using `fetchClient` + `PATHS.auth.login`
- `src/app/testBypass.ts` — DEV-only query-flag parser (`forceState`, `palette`); production-safe via `import.meta.env.DEV`
- `src/test/renderWithRouter.tsx` + `mockFetch.ts` test helpers
- Playwright harness: `@playwright/test` installed, `apps/panel/client/tests/e2e/` directory, `fixtures/fixtures.ts`, 17 baseline screenshots committed to `apps/panel/client/tests/e2e/__screenshots__/`
- `test:e2e` root script flips from placeholder to `playwright test`; Story 0's `scripts/test-e2e-placeholder.mjs` is deleted
- README dev-mode section: `pnpm --filter client dev`, `pnpm --filter server dev`, `pnpm start` rows with use case + port

**Scope — Out:**
- React Router registration, `/home` / `/settings` routes, `<RequireAuth>` guard — Story 6
- Electron shell, `pnpm start` end-to-end — Story 7
- Server-backed palette persistence (deferred per tech design §Deferred Items)

**Dependencies:** Story 0 (shared package for `PATHS`, `ERROR_CODES`, `errorEnvelopeSchema`, `AppError`). Story 2 for the sign-in button's 501 path to be observable via the running server in dev mode (not strictly required — the component test uses a mocked `authApi`).

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

**AC-1.2:** The landing view contains the product name, a one-sentence description, a five-item capability list naming channel management, live moderation, clip creation, custom `!commands`, and welcome bot, and a single sign-in button. Exact copy is implementation-level.

- **TC-1.2a: Landing content inventory**
  - Given: The landing view is rendered
  - When: The view is inspected
  - Then: Product name, one-sentence description, exactly five capability items (channel management, live moderation, clip creation, custom `!commands`, welcome bot in any order), and one sign-in button are all visible

**AC-1.3:** The sign-in button is active (not disabled). Activation (click, keyboard, or assistive-technology action) invokes the auth entry point at `POST /auth/login`. The renderer handles the server response according to its shape: on an OAuth redirect (Epic 2+), follow it; on an error envelope, surface a message keyed to the returned error code.

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
  - *Verification:* Observed-run, added to the observed-run checklist in this story's README contribution.
- **TC-1.4b: No outbound HTTP on mount**
  - Given: The landing view mounts in a test harness with a recording HTTP mock
  - When: Mount completes
  - Then: Zero requests have been issued to the server

**AC-3.3:** `pnpm --filter client dev` serves the renderer alone via Vite on a localhost port. The landing view renders in any modern browser at that URL without requiring Electron, Fastify, or native-module rebuilds.

- **TC-3.3a: Renderer-only mode serves landing**
  - Given: Repo is installed, no Electron invocation, no Fastify running
  - When: The developer runs `pnpm --filter client dev` and opens the reported localhost URL in a browser
  - Then: The landing view renders with AC-1.2 content
  - *Verification:* Observed-run.

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**Palette token roles (CSS variables installed on `:root` by `<PaletteProvider>`):**

| Token | Purpose |
|-------|---------|
| `--panel-bg`, `--panel-bg-panel`, `--panel-bg-panel-overlay` | Surface backgrounds at three depths |
| `--panel-ink`, `--panel-ink-muted` | Text on background |
| `--panel-primary`, `--panel-primary-ink` | Primary action color + contrast text |
| `--panel-accent`, `--panel-accent-ink` | Secondary/complementary color + contrast text |
| `--panel-warn` | Warnings |
| `--panel-rule` | Subtle dividers |
| `--panel-scanline`, `--panel-grid-line`, `--panel-mesh` | Decorative overlays |

Default palette: `amber` (Amber CRT — highest legibility, 11.8:1 body contrast).

**Sign-in handler state machine (`useSignIn`):**

| State | Transition trigger |
|-------|--------------------|
| `idle` | Initial |
| `pending` | `trigger()` called; sets `code=null`, `message=''` |
| `error` | `postAuthLogin()` returns `{ status: 'error', code, message }`; `message` mapped by `messageFor(code, serverMessage)` |
| `success` | Unreachable in Epic 1 (server always returns error); reserved for Epic 2 OAuth redirect |

**`messageFor(code)` user-visible message by code:**

| Code | User-visible message |
|------|----------------------|
| `NOT_IMPLEMENTED` | `"Sign-in is wired but Epic 2 (Twitch OAuth) has not yet landed. " + serverMessage` |
| `ORIGIN_REJECTED` | `"The request origin was rejected by the local server. Restart the app if this persists."` |
| `INPUT_INVALID` | `"Request validation failed: " + serverMessage` |
| `AUTH_REQUIRED` | `"Authentication required."` (defensive; unreachable on exempt `/auth/login`) |
| `SERVER_ERROR` | `"Unexpected error. Check the server log and retry."` |

**`testBypass` query flags (DEV-only):**

| Flag | Values | Effect |
|------|--------|--------|
| `forceState` | `default` · `sign-in-pending` · `sign-in-error-501` · `sign-in-error-403` · `sign-in-error-500` · `redirect-home` · `redirect-settings` | Pre-seeds `useSignIn` state or `location.state.redirectedFrom` without any server interaction |
| `palette` | `neon` · `amber` · `cream` · `pocket` · `beacon` | Forces the palette ID instead of reading `localStorage` |

Production safety: `isTestBypassEnabled()` returns `import.meta.env.DEV`. In `pnpm package` builds the function resolves to `false` at bundle time and Rollup dead-code-eliminates the parser.

**Playwright screenshot matrix (17 screenshots):**

| State | Palettes | Count |
|-------|----------|-------|
| `landing.default` | all 5 | 5 |
| `landing.sign-in-pending` | amber | 1 |
| `landing.sign-in-error-501` | all 5 | 5 |
| `landing.sign-in-error-403` | amber | 1 |
| `landing.sign-in-error-500` | amber | 1 |
| `landing.redirect-home` | amber | 1 |
| `landing.redirect-settings` | amber | 1 |
| `landing.palette-switcher-open` | amber | 1 |
| `landing.default` at 960×600 (responsive min) | amber | 1 |

**Test files for this story:**
- `client/src/views/Landing.test.tsx` — 4 tests (TC-1.2a, TC-1.4b, TC-2.4a belt-and-suspenders, 1 non-TC redirect-flash)
- `client/src/components/SignInButton.test.tsx` — 6 tests (TC-1.3a, TC-1.3b, TC-1.3c, 3 non-TC pending/error/reset)
- `client/src/palette/PaletteProvider.test.tsx` — 5 tests (all non-TC)
- `client/src/palette/PaletteSwitcher.test.tsx` — 3 tests (all non-TC)
- `client/src/api/fetchClient.test.ts` — 4 tests (all non-TC)
- `client/src/app/testBypass.test.ts` — 3 tests (all non-TC)
- `client/tests/e2e/landing.spec.ts` — 17 Playwright screenshot tests

**Tests delivered this story:** 42 (22 component/unit + 3 testBypass + 17 Playwright).

See [`../tech-design-client.md`](../tech-design-client.md) §Landing View, §Palette System, §Sign-In Handler, §API Client, §State-Driving Query Flags, and [`../ui-spec.md`](../ui-spec.md) entirely for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] Renderer boots at `http://localhost:5173` via `pnpm --filter client dev` and shows the landing view
- [ ] Landing composition matches `ui-spec.md` §7 for the default palette at 1280×800 (visual comparison against `neo_arcade_palettes.jsx` reference)
- [ ] All 5 palettes render without visual regression when switched (verified via Playwright matrix)
- [ ] Sign-in button: active (not disabled), accessible name present, `aria-label="Sign in with Twitch"`
- [ ] Clicking sign-in calls `postAuthLogin()` exactly once; error envelope surfaces a per-code message via `<ErrorEnvelopeCard />`
- [ ] Zero outbound HTTP on landing mount (`fetchClient` is not called; palette preference reads `localStorage` synchronously)
- [ ] `testBypass` flags work in DEV; production bundle does not include the parser body
- [ ] Playwright harness installed, `test:e2e` runs `playwright test`, 17 baselines committed
- [ ] Baselines visually reviewed against `docs/references/neo_arcade_palettes.jsx` before commit — any divergence is either corrected in the renderer or documented in `ui-spec.md` §8 as an accepted deviation. Committing baselines blindly would freeze any first-run visual bug as the regression reference.
- [ ] Story 0's `test-e2e-placeholder.mjs` deleted
- [ ] Self-hosted fonts load from `public/fonts/`; Google Fonts CDN used only in dev
- [ ] `prefers-reduced-motion` respected: marquee freezes, scanlines static, hover translations preserved
- [ ] README gains dev-mode table row for `pnpm --filter client dev`
- [ ] 42 tests pass (25 Vitest + 17 Playwright)
- [ ] `pnpm verify-all` passes
