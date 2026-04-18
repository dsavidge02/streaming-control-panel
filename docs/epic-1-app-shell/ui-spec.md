# UI Specification: Epic 1 â€” App Shell & Landing

This companion owns the **visual, state-presentation, and interaction** intent for Epic 1's UI. The tech design companions ([`tech-design-client.md`](./tech-design-client.md) specifically) own component identity, TypeScript interfaces, module placement, and data contracts. This doc references those identifiers; it does not redefine them.

Produced because all three UI-companion invocation rubric triggers fire:

1. **Net-new screens** â€” Landing view, `/home` placeholder, `/settings` placeholder.
2. **New reusable UI primitives + token families** â€” Tailwind 4.1 + shadcn/ui, plus five neo-arcade palette token sets.
3. **Reference materials provided** â€” [`docs/references/neo_arcade_palettes.jsx`](../references/neo_arcade_palettes.jsx).

---

## Table of Contents

- [1. Reference Material Analysis](#1-reference-material-analysis)
- [2. Visual System Strategy](#2-visual-system-strategy)
- [3. Existing UI Inventory](#3-existing-ui-inventory)
- [4. Screen Inventory](#4-screen-inventory)
- [5. AC-to-Screen/State Map](#5-ac-to-screenstate-map)
- [6. State Coverage per Screen](#6-state-coverage-per-screen)
- [7. Component Specifications](#7-component-specifications)
- [8. Open Questions and Assumptions](#8-open-questions-and-assumptions)
- [Verification Surface](#verification-surface)

---

## 1. Reference Material Analysis

### Artifact

- Path: `docs/references/neo_arcade_palettes.jsx`
- Format: Single-file React component with inline palette definitions and an interactive palette switcher
- Size: 613 lines
- Authored by the product owner as a visual starting point for Epic 1's landing view

### What the Reference Establishes

The reference commits the landing view to a **neo-arcade aesthetic**: monospace typography (Press Start 2P for display, Space Mono for body), offset-shadow affordances on interactive elements, CRT-style scanlines as a decorative overlay, grid-line texture on backgrounds, and radial color-mesh gradients. The visual register reads as "retro arcade terminal" rather than "modern SaaS dashboard."

It also commits the product to **five named palettes**:

| Palette ID | Palette Name | Tag | Intent |
|------------|--------------|-----|--------|
| `amber` | Amber CRT | `dark Â· high-contrast` | Highest legibility of the set; amber monochrome terminal. Default per D9. |
| `neon` | Neon Night | `bold Â· dark` | Cyan-on-violet with softened pink. Refined from the first draft for readability. |
| `cream` | Cream Soda | `soft Â· light` | Light theme. Warm cream background. Coral + teal. |
| `pocket` | Pocket Monochrome | `soft Â· dark` | Desaturated Game Boy greens. Low eye strain for long sessions. |
| `beacon` | Signal Beacon | `accessible Â· dark` | Blue/yellow, distinguishable across all common color-vision deficiencies. |

Each palette defines a **role-based token set** â€” `bg`, `bgPanel`, `ink`, `primary`, `accent`, `warn`, plus supporting roles like `scanline`, `gridLine`, and `mesh`. The role naming (not color naming) makes components palette-agnostic: a component that uses `var(--panel-primary)` renders correctly regardless of which palette is active.

The reference also establishes a **four-zone landing layout**:

1. Marquee (top scrolling banner)
2. Navigation bar with gated-route flash banner below it
3. Hero (8-column) + HUD stack (4-column) in a 12-column grid
4. Capability grid (5 tiles, one per product capability)
5. Footer

And a set of **design principles encoded in the code comments**:

- Body text â‰¥ 4.5:1 contrast ratio
- Display text aims for â‰¥ 7:1 where it carries information
- Interactive elements carry non-color affordances (offset shadow, border, layout) so color-blind and high-contrast-mode users parse correctly
- Status indicators pair color with text labels

### What the Reference Does Not Establish

- Specific typography scale beyond "Press Start 2P for display, Space Mono for body"
- Detailed spacing rhythm (the reference uses Tailwind utility classes inline; no committed spacing scale)
- A dark/light mode distinct from the per-palette choice (cream is light; the other four are dark; palette *is* mode)
- Loading, error, empty, or disabled states beyond the single sign-in error path shown in the mockup
- Keyboard navigation or focus states (the reference notes accessibility but does not spec focus rings)
- Animation/motion detail beyond the marquee's 28s linear infinite scroll and a 0.5px hover translation on capability tiles

Where the reference is silent, this UI spec fills the gap with explicit decisions (Â§7 Component Specifications).

### Fidelity Mandate

The tech design and stories reference-honor the neo-arcade mockup for Epic 1's landing. Deviations from the reference require an entry in Â§8 Open Questions and Assumptions with rationale. Specifically: **the color values per palette are verbatim from the reference** â€” no softening or adjustment without documented rationale.

### Running the Reference for Side-by-Side Comparison

The reference is a self-contained React component. To render it locally for visual comparison against the implementation:

1. Create a throwaway Vite sandbox: `pnpm dlx create-vite@latest neo-reference --template react-ts`
2. Replace `src/App.tsx` with the contents of `docs/references/neo_arcade_palettes.jsx` (rename `.jsx â†’ .tsx` if needed; Tailwind classes work as-is once Tailwind 4 is installed)
3. `pnpm dev` â€” open at `http://localhost:5173`; the palette switcher at the top lets you cycle through all five
4. Run the real landing view in parallel (`pnpm --filter client dev`, which also serves on 5173 â€” use different ports) and diff visually

This is the fidelity floor: any observable divergence between the reference's rendered output and the real landing view â€” at the same palette â€” is a UI defect unless documented in Â§8.

---

## 2. Visual System Strategy

### Strategy: Establish (narrowed â€” gap documentation)

Per the v2 skill's narrowed-Establish path: the project is greenfield, no existing design system, and the reference commits the aesthetic and five palettes but not the full scale. This spec documents **minimum required additions** for Epic 1's surface, plus **visible system gaps** for future design-system work. It does not attempt to define a full design system (complete type scale, component library, spacing taxonomy) â€” that is a separate effort, potentially a future `ls-design-system` activity.

### What Epic 1 Establishes

**Token families** (CSS variables on `:root`, swapped at runtime by `<PaletteProvider>`):

- `--panel-bg`, `--panel-bg-panel`, `--panel-bg-panel-overlay` â€” surface backgrounds at three depths
- `--panel-ink`, `--panel-ink-muted` â€” text on background
- `--panel-primary`, `--panel-primary-ink` â€” primary action color + its contrast text
- `--panel-accent`, `--panel-accent-ink` â€” secondary/complementary color + contrast text
- `--panel-warn` â€” warnings; distinct hue from primary and accent for every palette
- `--panel-rule` â€” subtle dividers
- `--panel-scanline`, `--panel-grid-line` â€” decorative overlays
- `--panel-mesh` â€” radial gradient background

**Typography pairings:**

| Use | Family | Weight | Source |
|-----|--------|--------|--------|
| Display (h1, hero, capability numbers) | `'Press Start 2P', monospace` | regular | Google Fonts |
| Body, UI chrome | `'Space Mono', monospace` | 400 / 700 | Google Fonts |

Both fonts load from Google Fonts in dev and are self-hosted in the packaged build (copied into `apps/panel/client/public/fonts/`) to avoid network dependency at runtime.

**Interactive affordance pattern** â€” every interactive element that carries information through color *also* carries:

- **Offset shadow** â€” `6px 6px 0 var(--panel-accent)` for primary actions, `4px 4px 0 var(--panel-accent)` for secondary
- **Border** â€” `2px solid var(--panel-primary)` or `1px solid var(--panel-rule)` depending on weight
- **Hover translation** â€” `hover:-translate-y-0.5` (buttons) or `hover:-translate-y-1` (capability tiles)
- **Focus ring** â€” `outline: 2px solid var(--panel-accent); outline-offset: 2px` on `:focus-visible`

This guarantees color-independent affordance per the reference's accessibility comments.

### System Gaps to Revisit

Gaps that Epic 1 does not close but that downstream epics will need:

| Gap | Likely First Consumer | Notes |
|-----|----------------------|-------|
| Complete typography scale (h1â€“h6, body-lg/md/sm, caption) | Epic 3 (channel config forms) | Epic 1 defines display + body only |
| Form input styles (text, select, textarea, toggle, checkbox) | Epic 3 | Epic 1 has no form inputs |
| Table styles for list views | Epic 3 (follower/sub lists) | â€” |
| Modal + confirmation dialog primitive | Epic 2 (Reset app confirmation) | â€” |
| Toast/notification primitive | Epic 4a (live action feedback) | â€” |
| Chat message row primitive | Epic 4a | â€” |
| Loading skeleton for data-fetching surfaces | Epic 3 | Epic 1 has no async data displays |
| Responsive breakpoint scale beyond `lg:` | Epic 4a (narrow-viewport live view) | Epic 1 uses Tailwind defaults |

These gaps are called out so future epics do not treat their introduction as "drifting from Epic 1's system" â€” they are planned extensions, not deviations.

### What Epic 1 Does Not Establish

Explicitly deferred per the narrowed-Establish stance:

- A full component library
- A documented motion/animation language
- Dark/light mode toggle separate from palette (palette is mode)
- Icon library (Epic 1 uses text symbols â€” `â–¶`, `â—ˆ`, `â—†`, `âš ` â€” rendered by the font)

---

## 3. Existing UI Inventory

Greenfield project. No prior UI, no prior components, no prior tokens.

### Components

None.

### Design Tokens

None.

### Page Layouts

None.

### Typography Conventions

None.

### State Treatment Patterns

None.

### Styling Approach

Committed by tech arch: **Tailwind CSS 4.1** (Oxide engine, `@tailwindcss/vite` plugin, no PostCSS config file) + **shadcn/ui** primitives copied in as Epic 1 needs them.

Epic 1 copies in **zero shadcn/ui components**. The neo-arcade landing view is custom composition on top of Tailwind; shadcn/ui primitives are for form inputs, dialogs, dropdowns â€” surfaces Epic 1 does not present. Epic 2 will be the first epic to pull in shadcn/ui components (Reset action confirmation dialog, Settings form inputs). The token system installed here (CSS variables via `<PaletteProvider>`) will feed shadcn/ui's theming slots when they arrive.

### Accessibility Patterns Already in Use

None. Epic 1 establishes the first: non-color affordances on every interactive element, per Â§2.

---

## 4. Screen Inventory

Epic 1 ships **three screens**, all of which exist as React routes.

| Screen ID | Route | Gated? | Purpose | ACs |
|-----------|-------|--------|---------|-----|
| `landing` | `/` | No | Product introduction; sign-in entry point; palette switcher; system status HUD | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-2.4 |
| `home-placeholder` | `/home` | Yes | Empty gated placeholder â€” Epic 2 populates with authenticated home | AC-2.6 |
| `settings-placeholder` | `/settings` | Yes | Empty gated placeholder â€” Epic 2 populates with Reset action | AC-2.6 |

The two placeholder screens are listed for completeness but render no visible content in Epic 1 (the `<RequireAuth>` guard redirects away before the component mounts). The landing screen carries the entire visible surface of Epic 1.

### Flow-to-Screen Mapping

| Epic Flow | Starts on | Ends on | Epic Section |
|-----------|-----------|---------|--------------|
| Launching the app | (OS launcher) | landing | Epic Â§Flow 1 |
| Sign-in click | landing | landing (with error card) | Epic Â§Flow 1 |
| Unauthenticated nav attempt | landing â†’ (attempted route) | landing (with redirect flash) | Epic Â§Flow 2 |
| Palette switch | landing | landing (with different tokens) | UI spec Â§Flow A |

---

## 5. AC-to-Screen/State Map

Every frontend-visible AC maps to a specific screen and state here. Back-end-only ACs are marked out of scope for the UI spec.

| AC | Screen | State | Notes |
|----|--------|-------|-------|
| AC-1.1 | landing | default (idle) | Window opens, landing visible |
| AC-1.2 | landing | default (idle) | Full content inventory present |
| AC-1.3 | landing | multiple: button-idle, button-pending, error-shown | Sign-in contract |
| AC-1.4 | landing | default mount | No HTTP fires |
| AC-2.1 | landing | post-redirect (RedirectFlash visible) | Gated nav attempt bounced |
| AC-2.2 | â€” | â€” | Server-only (401 envelope); no UI surface |
| AC-2.3 | â€” | â€” | Server-only (exempt list); no UI surface |
| AC-2.4 | landing | default (idle) | Landing reachable unauth |
| AC-2.5a | â€” | â€” | Server-only (registrar) |
| AC-2.5b | (client-side) | â€” | Any gated route â†’ redirect to landing |
| AC-2.6 | home-placeholder / settings-placeholder | â€” | Route registered gated; UI content intentionally empty |
| AC-3.1 â€” AC-3.5 | â€” (dev-mode UX) | â€” | Observed-run; not per-screen |
| AC-4.1 â€” AC-4.3 | â€” (packaging) | â€” | Observed-run |
| AC-5.x | â€” (CI) | â€” | No UI surface |
| AC-6.x | â€” | â€” | Server-only |
| AC-7.x | â€” | â€” | Server-only |
| AC-8.x | landing | error-shown (for 501 envelope rendering) | Error card uses envelope contract |
| AC-8.3 | landing | default | Registry panel shows all 5 codes |
| AC-9.x | â€” | â€” | Server-only |

**ACs with no UI surface in Epic 1:** AC-2.2, AC-2.3, AC-2.5a, AC-3.x observed-run, AC-4.x, AC-5.x, AC-6.x, AC-7.x, AC-9.x. These are either pure server behavior or developer-experience concerns verified by observation.

---

## 6. State Coverage per Screen

### Screen: `landing`

| State | Trigger | Visual | Verification |
|-------|---------|--------|--------------|
| `default` | Initial load, idle | Full landing: marquee, nav, hero with active sign-in button (no error card), HUD showing all statuses green, capability grid, footer, palette switcher sticky top | Playwright screenshot `landing.default.{palette}.png` |
| `palette-switcher-collapsed` | Default on landing | Compact trigger button visible in the top-right with a 3-swatch preview of the active palette and the active palette name; the 5-palette pane is hidden until activated | `landing.default.{palette}.png` (implicit default state) |
| `sign-in-pending` | User clicks sign-in, request in flight | Button shows "â–¶ LOADING..." and is disabled (`aria-disabled=true`). HUD `POST /auth/login` row shows `PENDING` in warn color. Rest unchanged | `landing.sign-in-pending.{palette}.png` |
| `sign-in-error-not-implemented` | `POST /auth/login` returns 501 `NOT_IMPLEMENTED` | Error card appears below sign-in button: "ERROR Â· 501 Â· NOT_IMPLEMENTED" header, explanatory message referencing Epic 2, raw envelope JSON footer, "â—€ CONTINUE?" dismiss link. Registry panel highlights `NOT_IMPLEMENTED` row. HUD row shows `501` in warn | `landing.sign-in-error-501.{palette}.png` |
| `sign-in-error-origin` | `POST /auth/login` returns 403 `ORIGIN_REJECTED` (degenerate â€” should only occur on misconfigured dev) | Error card: "ERROR Â· 403 Â· ORIGIN_REJECTED" with message about restart. Registry panel highlights `ORIGIN_REJECTED` | `landing.sign-in-error-403.{palette}.png` |
| `sign-in-error-server` | `POST /auth/login` returns 500 or network failure | Error card: "ERROR Â· 500 Â· SERVER_ERROR" | `landing.sign-in-error-500.{palette}.png` |
| `redirect-flash-home` | User navigated to `/home` unauth, bounced back | Flash banner between nav and hero: "âš  access denied Â· /home requires authentication Â· warp to LANDING" in primary-on-ink with accent offset shadow. Auto-dismisses after 2.4s | `landing.redirect-home.{palette}.png` |
| `redirect-flash-settings` | Same, from `/settings` | Flash banner indicates `/settings` path | `landing.redirect-settings.{palette}.png` |
| `palette-switching` | User activates the collapsed `<PaletteSwitcher />` trigger, then clicks a swatch in the expanded pane | Trigger expands into the full 5-palette pane plus attribution row; selecting a swatch re-tokenizes the landing without layout shift and the active swatch gains filled background + ring | `landing.palette-switcher-open.amber.png` for the expanded pane, plus `landing.default.{palette}.png` for the applied palette |

**Responsive variants:**

| Breakpoint | Layout change |
|------------|---------------|
| Default (`< lg`, <1024px) | Hero + HUD stack vertically (both `col-span-12`); capability grid collapses from 5-column to 2-column |
| `lg` (â‰¥1024px) | 12-column grid splits 8 (hero) / 4 (HUD stack); capability grid is 5 columns |

Minimum window size per `server/src/electron/window.ts`: 960Ã—600. Below `lg` breakpoint, the landing still works; it just reflows vertically. Tests capture both breakpoints at 1280Ã—800 (default) and 960Ã—600 (minimum).

### Screen: `home-placeholder`

| State | Trigger | Visual | Verification |
|-------|---------|--------|--------------|
| (unreachable in Epic 1) | â€” | Guard redirects before mount | No screenshot |

### Screen: `settings-placeholder`

Same â€” unreachable. Epic 2 activates.

---

## 7. Component Specifications

Every component here references its tech-design identifier from [`tech-design-client.md`](./tech-design-client.md). This doc owns visual treatment, state presentation, and accessibility expectations. It does not redefine interfaces or props.

### `<Marquee />`

- **TD identifier:** `client/src/components/Marquee.tsx`
- **Visual structure:** Fixed-height (â‰ˆ32px) banner spanning full viewport width at the very top. Content is a single horizontally-scrolling string containing capitalized declarative phrases separated by `â˜…` glyphs.
- **Tokens used:** `--panel-bg-panel` (background), `--panel-accent` (text), `--panel-primary` (bottom border 1px).
- **Typography:** Space Mono, 11px, tracking `0.3em`, uppercase.
- **Content (Epic 1):** "â˜… PLAYER ONE READY â˜… INSERT COIN â˜… NOW LOADING APP SHELL v0.1 â˜… LOCAL Â· SINGLE-INSTALL Â· BOUND TO BROADCASTER â˜… PRESS START â˜…" (string doubled so the 28s linear infinite scroll loops seamlessly).
- **Motion:** `animation: marq 28s linear infinite`; `@keyframes marq { 0% transform: translateX(0%); 100% transform: translateX(-50%); }`.
- **Accessibility:** `aria-hidden="true"` â€” the marquee is decorative flavor text; screen readers skip it. AC-1.2 content is carried by semantic HTML below it.

### `<NavBar />`

- **TD identifier:** `client/src/components/NavBar.tsx`
- **Visual structure:** Horizontal bar below the marquee. Left: app icon (9Ã—9 square with `â–¶` glyph, filled with `--panel-primary`) + two-line wordmark ("CONTROL//PANEL" accented, "v0.1 Â· electron" muted). Right: three tab buttons (HOME, PLAY, OPTIONS).
- **Tab labels:** HOME (path `/`, not gated), PLAY (path `/home`, gated), OPTIONS (path `/settings`, gated). Gated tabs get `â—ˆ` suffix.
- **Tab states:** `active` has filled `--panel-primary` background + `--panel-primary-ink` text + primary border. `inactive` has transparent background + ink text + rule border.
- **Click behavior (Epic 1):** Active tab (HOME): no-op. Inactive non-gated: navigate. Inactive gated (PLAY/OPTIONS): triggers `<RedirectFlash>` via React Router state, then navigates to `/`.
- **Accessibility:** Each tab is a `<button type="button">` with `aria-current="page"` when active. The gated-route `â—ˆ` glyph is accompanied by a `<span class="sr-only">requires authentication</span>` for screen reader clarity.

### `<RedirectFlash />`

- **TD identifier:** `client/src/components/RedirectFlash.tsx`
- **Visual structure:** Banner appearing between nav and hero. Filled `--panel-primary` background, `--panel-primary-ink` text, 6px accent offset shadow. Text reads "âš  ACCESS DENIED Â· {path} REQUIRES AUTHENTICATION Â· WARP TO LANDING".
- **Trigger:** Reads `location.state.redirectedFrom` from React Router; renders only when non-null. Auto-clears after 2.4s via `useEffect` + `setTimeout` that calls `window.history.replaceState` to null out the state.
- **Accessibility:** `role="status"`, `aria-live="polite"`. Non-modal â€” the user can still interact with the rest of the page.

### `<Hero />`

- **TD identifier:** `client/src/components/Hero.tsx`
- **Visual structure:** Three stacked blocks in an 8-column hero region:
  1. **Stage indicator** â€” "â—† STAGE 01 â€” APP SHELL & LANDING" in tracking-wide uppercase, 10px, three-color (accent Â· muted Â· primary).
  2. **Headline** â€” h1, Press Start 2P, clamp(38px, 5.5vw, 78px), line-height 0.85. Three-line composition: "RUN YOUR / STREAM. / **ONE MACHINE.**" with the third line accented.
  3. **Description** â€” p, Space Mono 14px, max-width xl. Text from reference lines 339-343 verbatim.
  4. **Sign-in row** â€” `<SignInButton />` + "â†’ POST /auth/login" muted caption to its right.
  5. **Conditional `<ErrorEnvelopeCard />`** â€” appears below sign-in row when the hook is in `error` state.
- **Tokens used:** `--panel-ink` (headline body), `--panel-accent` (accent line), `--panel-inkMuted` (caption).
- **Text shadow on headline:** `3px 3px 0 var(--panel-primary), 6px 6px 0 var(--panel-accent)` â€” creates the chromatic-aberration arcade feel while staying readable (per reference accessibility note).
- **Responsive:** Below `lg`, headline's font-size clamp takes over; paragraph max-width adjusts.

### `<SignInButton />`

- **TD identifier:** `client/src/components/SignInButton.tsx`
- **Visual structure:** Filled `--panel-primary` background button, `--panel-primary-ink` text. 6px accent offset shadow + 6px offset of 1px bg border (reference line 353) for the layered arcade effect. 2px solid outer border in `--panel-bg` (dark palettes) or `--panel-ink` (light palette â€” cream).
- **Idle label:** "â–¶ PRESS START â€” TWITCH"
- **Pending label:** "â–¶ LOADING..."
- **Hover:** `-translate-y-0.5`
- **Focus-visible:** `outline: 2px solid var(--panel-accent); outline-offset: 2px`
- **Disabled state (pending):** `cursor: not-allowed`, button retains visual weight but `aria-disabled=true`
- **Accessibility:** `<button type="button" aria-label="Sign in with Twitch">` (even though visible text carries it, the aria-label makes screen-reader announcement unambiguous when label text changes to "LOADING").

### `<ErrorEnvelopeCard />`

- **TD identifier:** `client/src/components/ErrorEnvelopeCard.tsx`
- **Visual structure:** Layered box. Outer: `--panel-bg` fill, 2px `--panel-primary` border, 6px `--panel-accent` offset shadow. Inner padding 20px. Contents top-to-bottom:
  1. **Header row** â€” 6Ã—6 filled `--panel-primary` square with `!` glyph + "ERROR Â· {HTTP status} Â· {CODE}" in accent, 11px tracking-wide uppercase
  2. **Message body** â€” 13px line-height relaxed, `--panel-ink`
  3. **Raw envelope** â€” `{ error: { code: "...", message: "â€¦" } }` in muted ink, 10px, pre-formatted
  4. **Dismiss link** â€” "â—€ CONTINUE?" in accent, 10px tracking, text-only
- **Accessibility:** `role="alert"`. The dismiss link is a button (`<button type="button">`) with `aria-label="Dismiss error"`.

### `<SystemStatusPanel />`

- **TD identifier:** `client/src/components/SystemStatusPanel.tsx`
- **Visual structure:** 4-column-region card. `--panel-bgPanelOverlay` background, 1px `--panel-primary` border. Header "â–£ SYSTEM STATUS" in accent-on-bgPanel, tracking-wide uppercase. Five status rows:
  - `SSE /live/events` â†’ value `HEARTBEAT` (ok: `--panel-accent`)
  - `POST /auth/login` â†’ value `IDLE` / `PENDING` / `501` (reflects current sign-in state)
  - `ORIGIN CHECK` â†’ value `ALLOWLIST` (ok)
  - `SQLITE` â†’ value `BASELINE` (ok)
  - `BIND 127.0.0.1` â†’ value `PORT 7077` (ok; constant, not configurable)
- **Status-dot affordance:** 1.5Ã—1.5 filled square to the left of each label â€” `--panel-accent` when ok, `--panel-primary` when warn/error. Color + position + shape, not color alone.
- **Data sourcing (Epic 1):** All values are static except `POST /auth/login` which reads from the `useSignIn()` hook. `SSE /live/events` is hard-coded to `HEARTBEAT` even though no subscription is live in Epic 1 â€” the panel is a visual HUD, not a live readout, until Epic 4a wires real data.
- **Accessibility:** `<ul>` / `<li>` semantics with each row being a labeled value. Status dot is `aria-hidden`; the text value carries the state.

### `<ErrorRegistryPanel />`

- **TD identifier:** `client/src/components/ErrorRegistryPanel.tsx`
- **Visual structure:** Same chassis as `<SystemStatusPanel>` but 1px `--panel-accent` border. Header "â˜° ERROR REGISTRY" in primary.
- **Content:** Five rows, one per registry code. Left column: code name. Right column: HTTP status in accent color.
- **Active highlighting:** When `useSignIn()` is in error state, the row matching the current error code gets `font-weight: 700` and `color: var(--panel-primary)` to visually light up. Other rows stay `--panel-ink`.
- **Data sourcing:** The registry itself is imported from `@panel/shared`. This panel re-uses the real shared registry â€” TC-8.3a is partly verifiable through this surface.
- **Accessibility:** `<dl>` / `<dt>` / `<dd>` semantics. Active row has `aria-current="true"` when highlighted.

### `<CapabilityGrid />`

- **TD identifier:** `client/src/components/CapabilityGrid.tsx`
- **Visual structure:** Section with "â—† CAPABILITIES â—†" header, then a responsive grid of 5 tiles.
- **Grid:** `grid-cols-2` default, `md:grid-cols-5` at medium. Gap 12px (`gap-3`).
- **Tile structure:** Each tile is â‰ˆ180Ã—140. `--panel-bgPanelOverlay` background, 1px `--panel-primary` border, 4px `--panel-accent` offset shadow.
  - Top: large number (01â€“05), Press Start 2P 28px, `--panel-accent` color with `2px 2px 0 var(--panel-primary)` text-shadow
  - Middle: title in tracking-wide uppercase, 11px, `--panel-ink`
  - Bottom: description, 11px line-height relaxed, `--panel-inkMuted`
- **Hover:** `-translate-y-1`
- **Tile content (AC-1.2):** exactly five tiles:
  | # | Title | Description |
  |---|-------|-------------|
  | 01 | Channel management | Title, category, tags, language, content labels, branded flag. |
  | 02 | Live moderation | Timeout, ban, delete â€” anchored on the chat message itself. |
  | 03 | Clip creation | One click. Draft returned. Finalize later in Twitch. |
  | 04 | Custom !commands | Your words. Role-tiered: MOD, VIP, GENERAL. |
  | 05 | Welcome bot | First-time chatter detection keyed on Twitch user_id. |
- **Accessibility:** `<ul>` with tiles as `<li>`. Not interactive in Epic 1 (Epic 2+ may make them navigable to per-feature surfaces).

### `<Footer />`

- **TD identifier:** `client/src/components/Footer.tsx`
- **Visual structure:** Thin bar at bottom with 1px top border (`--panel-rule`). Two-column: left "Â© HIGH SCORE Â· STREAMING CONTROL PANEL", right "HI: 9999999 Â· EPIC 1 / 6".
- **Tokens:** `--panel-inkMuted` text, `--panel-rule` border.
- **Accessibility:** `<footer>` semantic. Content decorative; screen readers read it but it carries no action.

### `<PaletteSwitcher />`

- **TD identifier:** `client/src/palette/PaletteSwitcher.tsx`
- **Visual structure:** Fixed position top-right, z-index 50. Small dark chrome (deliberately neutral `#0a0a0a` background) that sits on top of any active palette â€” the switcher's chrome is palette-independent so its affordance is visually stable while the page re-tokenizes.
- **Collapsed default state:** Compact trigger button in the top-right (`right-4 top-4`) showing a 3-swatch preview of the active palette (bg Â· primary Â· accent at 12Ã—12), the active palette name in 10px tracking uppercase, and a small expand affordance. Hover matches the rest of the UI (`-translate-y-0.5`).
- **Expanded state:** Activating the trigger expands into the full neutral-chrome pane. The existing 5-button palette row remains intact, and the attribution row below still shows the current palette name, tag, and blurb. A close affordance remains visible in the pane.
- **Dismiss behavior:** The expanded pane closes on trigger re-activation or explicit close affordance, click-outside, or `Escape`.
- **Button row:** 5 buttons, each showing a 3-swatch preview (bg Â· primary Â· accent stripes at 12Ã—12) + the palette name in 10px tracking uppercase.
- **Active button:** Filled `#e5e5e5` background, `#0a0a0a` text.
- **Inactive button:** Transparent background, `#aaa` text, `#333` border.
- **Attribution row below:** Current palette name in white, tag in muted, blurb in muted (from the palette object).
- **Accessibility:** The trigger uses `aria-expanded` + `aria-controls` tied to the expanded pane's stable id. The pane is a labeled `region`. Each palette button has `aria-pressed={id === active}` + `aria-label="Use {palette name} palette"`. Swatches are `aria-hidden`.

### `<BackgroundLayers />` (implicit in `<Landing>`)

Three stacked `absolute inset-0 pointer-events-none` layers:

1. **Scanlines** â€” `background-image: repeating-linear-gradient(0deg, var(--panel-scanline) 0 1px, transparent 2 4px)`
2. **Mesh** â€” `background: var(--panel-mesh)` (radial gradients from the palette)
3. **Grid** â€” linear-gradient lines at 48Ã—48 with `var(--panel-grid-line)`

All three are `aria-hidden`. Z-indices keep content on top.

---

## 8. Open Questions and Assumptions

### Open Questions

| # | Question | Impact | Resolution Path |
|---|----------|--------|-----------------|
| UQ1 | Does the marquee text need translation/localization in v1? | Epic 1 ships EN only; the marquee has hardcoded English | Assumed no. v1 is EN-only per PRD silence on i18n. Revisit post-M3 |
| UQ2 | Should Press Start 2P and Space Mono be self-hosted or loaded from Google Fonts in the packaged Electron build? | Offline-first concern â€” the product is local-first | Self-host. Fonts are packaged under `apps/panel/client/public/fonts/` in Story 5. Dev mode may use Google Fonts CDN for iteration speed |
| UQ3 | Cream Soda (light palette) interaction with the Electron title bar â€” on Windows/Linux, native chrome is dark; contrast with cream background creates an uncomfortable bright body on dark title bar | Visual | Accepted for Epic 1 (native chrome per D14). Post-M3 frameless chrome eliminates the issue |
| UQ4 | Scanlines + scrolling marquee + motion â€” trigger prefers-reduced-motion exemptions? | Accessibility | Yes. Respect `@media (prefers-reduced-motion: reduce)`: marquee freezes at 0% position; scanlines remain (static decoration); hover translations remain (too subtle to be motion-sickness-inducing) |

### Assumptions

| # | Assumption | Status |
|---|------------|--------|
| UA1 | The five-palette visual direction in the reference is the product's committed aesthetic, not a candidate | Confirmed by user decision (Q1 of Category 3) |
| UA2 | The landing view's HUD panels (`<SystemStatusPanel />`, `<ErrorRegistryPanel />`) are part of the product's visual identity, not just a mockup flourish | Assumed yes â€” they appear in the reference mockup and carry real information (registry contents are AC-8.3-visible) |
| UA3 | The capability grid's copy for Epic 1 lifts verbatim from the reference (channel management, live moderation, etc.). Some of these features don't exist yet in any epic and will be inaccurate in-flight | Accepted. Epic 1's landing is an aspirational ad for the full product; all 5 capabilities are actually delivered by M3. The risk of "landing advertises things that don't work yet" is mitigated by the error card explicitly saying "Epic 2 has not yet landed" |
| UA4 | Tailwind arbitrary values (`text-[11px]`, `tracking-[0.3em]`) are acceptable in Epic 1 | Yes â€” Tailwind 4.1's Oxide engine supports these without config. Establishing a full spacing/typography scale is in the Â§2 System Gaps list for a future design-system pass |
| UA5 | `<PaletteSwitcher />` defaults to a collapsed trigger button in the top-right; activating the trigger expands into the 5-palette pane described in Â§7. The reference mockup's always-visible switcher was palette-study chrome, not product chrome. Collapsed state: 3-swatch preview of the active palette + active palette name. Expanded state: full pane per Â§7. Close via trigger re-activation, click-outside, or Escape | Accepted post-Story-5 human visual review |

---

## Verification Surface

### Default: Playwright Screenshot Capture per State

Every named state in Â§6 produces a Playwright screenshot. The screenshot *is* the evidence that the state is reachable and renders correctly. It also doubles as a visual-regression baseline for future epics.

### Playwright Setup Spike (Story 5)

Before the first screenshot ACs close, a small spike during Story 5 installs the Playwright harness:

- `@playwright/test` + browsers installed
- `apps/panel/client/tests/e2e/` directory
- A `fixtures/fixtures.ts` that exposes `renderLanding(state, palette)` for each per-state entry point
- A state-driving convention: Playwright navigates to the renderer-only Vite dev URL with query-string flags (`?forceState=sign-in-error-501&palette=neon`) that the landing view reads at mount time to force a specific state without needing a backend
- A `screenshots/` directory ignored by git; a CI job that uploads them as artifacts

The query-string state-forcing mechanism is Epic 1-only. It's safe because the renderer-only dev mode has no authenticated routes and no persistent state; query-string flags bypass nothing real. Epic 2 removes the flags and uses real state drivers (pre-seeded SQLite databases via `buildTestServer`).

### State Matrix for Playwright (Chunk 5 + Chunk 6)

| State | Palettes | Count |
|-------|----------|-------|
| `landing.default` | all 5 | 5 screenshots |
| `landing.sign-in-pending` | 1 (amber) | 1 |
| `landing.sign-in-error-501` | all 5 | 5 |
| `landing.sign-in-error-403` | 1 (amber) | 1 |
| `landing.sign-in-error-500` | 1 (amber) | 1 |
| `landing.redirect-home` | 1 (amber) | 1 |
| `landing.redirect-settings` | 1 (amber) | 1 |
| `landing.palette-switcher-open` | 1 (amber) | 1 |
| Responsive: landing.default at 960Ã—600 (min window) | 1 (amber) | 1 |

Total: **17 screenshots**. The 5-palette multiplier applies only to `default` and `sign-in-error-501` because those are the states with the most palette-divergent visual content (the capability grid, the error card layering). Single-palette coverage suffices for palette-invariant states (redirect flash, pending spinner) â€” those verify *state rendering*, not palette fidelity.

### Fallback: Per-Screen State Capture Checklist (Not Used)

Per the v2 skill, if Playwright setup is genuinely blocked, a manual markdown checklist is an acceptable fallback. Epic 1 does not invoke this fallback â€” the Playwright spike is small enough (â‰ˆ1 day inside Story 5) that the screenshot signal is worth the investment.

### Validation Before Handoff Checklist (UI Spec Scope)

- [x] Every AC with a frontend surface maps to a screen/component (Â§5)
- [x] Every specified component traces to at least one AC or supports one visually (Â§7 back-links)
- [x] State coverage matrix is complete (Â§6 enumerates loading, error, success, empty, redirect, responsive variants)
- [x] Design tokens defined (Â§2 â€” all 12 CSS-var role tokens + palette mapping)
- [x] Responsive behavior specified for relevant breakpoints (Â§6 responsive variants)
- [x] Component contracts are implementable (Â§7 â€” specific colors, sizes, accessibility expectations)
- [x] Reference material fidelity verified (Â§1 â€” verbatim token values; deviations documented in Â§8)
- [x] One-way ownership respected â€” tech-design identifiers referenced, not redefined (every Â§7 block starts with a TD identifier link)
- [x] Verification surface specified (Playwright screenshot capture)

---

## Related Documentation

- Index: [`tech-design.md`](./tech-design.md)
- Server companion: [`tech-design-server.md`](./tech-design-server.md)
- Client companion: [`tech-design-client.md`](./tech-design-client.md)
- Test plan: [`test-plan.md`](./test-plan.md)
- Visual reference: [`../references/neo_arcade_palettes.jsx`](../references/neo_arcade_palettes.jsx)
- Epic: [`./epic.md`](./epic.md)

