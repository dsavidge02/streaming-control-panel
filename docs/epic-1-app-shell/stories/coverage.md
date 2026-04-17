# Epic 1 Coverage Artifact

This document is the proof that Epic 1's story sharding covers every AC and TC from [`../epic.md`](../epic.md) and that every critical user path has a story owner. Downstream reviewers read this cold to verify coverage without re-deriving it.

Two tables:

1. **Coverage Gate** — every AC and TC mapped to exactly one story
2. **Integration Path Trace** — every segment of the critical user paths mapped to a story and a TC

---

## Coverage Gate

Each row maps an AC (or AC+TC pair when an AC splits across stories) to its owning story. Every TC from the epic appears exactly once.

| AC | TC | Story |
|----|----|-------|
| AC-1.1 | TC-1.1a, TC-1.1b | Story 7 (TC-1.1a re-verified on packaged artifact in Story 8) |
| AC-1.2 | TC-1.2a | Story 5 |
| AC-1.3 | TC-1.3a, TC-1.3b, TC-1.3c | Story 5 |
| AC-1.4 | TC-1.4a, TC-1.4b | Story 5 |
| AC-2.1 | TC-2.1a, TC-2.1b, TC-2.1c | Story 6 |
| AC-2.2 | TC-2.2a | Story 4 |
| AC-2.3 | TC-2.3a, TC-2.3b, TC-2.3c | Story 4 |
| AC-2.4 | TC-2.4a | Story 6 (test assertion lives in Story 5's `Landing.test.tsx` per the test plan; see Story 6 §Technical Design for the AC-to-test reconciliation) |
| AC-2.5 | TC-2.5a | Story 4 (stub-gate inheritance exercised in Story 1's `registerRoute.test.ts` as infrastructure validation; the same test file continues green in Story 4 once the stub is replaced with the real `sessionPreHandler`) |
| AC-2.5 | TC-2.5b | Story 6 |
| AC-2.6 | TC-2.6a | Story 6 |
| AC-3.1 | TC-3.1a | Story 7 |
| AC-3.2 | TC-3.2a | Story 7 |
| AC-3.3 | TC-3.3a | Story 5 |
| AC-3.4 | TC-3.4a | Story 2 (partial — `/oauth/callback` route-policy observable) |
| AC-3.4 | TC-3.4b | Story 4 (completion — `/live/events` gated end-to-end) |
| AC-3.5 | TC-3.5a | Story 7 |
| AC-4.1 | TC-4.1a | Story 8 |
| AC-4.2 | TC-4.2a | Story 8 |
| AC-4.3 | TC-4.3a | Story 8 |
| AC-5.1 | TC-5.1a | Story 9 |
| AC-5.2 | TC-5.2a, TC-5.2b, TC-5.2c, TC-5.2d | Story 9 |
| AC-5.3 | TC-5.3a | Story 9 |
| AC-5.4 | TC-5.4a | Story 9 |
| AC-5.5 | TC-5.5a, TC-5.5b | Story 9 |
| AC-6.1 | TC-6.1a | Story 2 |
| AC-6.2 | TC-6.2a, TC-6.2b | Story 4 |
| AC-6.3 | TC-6.3a | Story 2 (partial — heartbeat cadence) |
| AC-6.3 | TC-6.3b | Story 4 (completion — unauth rejection) |
| AC-6.4 | TC-6.4a | Story 2 |
| AC-7.1 | TC-7.1a | Story 1 |
| AC-7.2 | TC-7.2a, TC-7.2b | Story 4 |
| AC-7.3 | TC-7.3a | Story 4 (test passes live in Story 2 via the Story 1 stub — GETs never trigger the Origin preHandler in any state; AC is owned by Story 4 because "passes without Origin validation" is only a meaningful claim once Origin validation exists) |
| AC-7.4 | TC-7.4a | Story 4 |
| AC-8.1 | TC-8.1a | Story 4 |
| AC-8.1 | TC-8.1b | Story 4 |
| AC-8.1 | TC-8.1c | Story 2 |
| AC-8.1 | TC-8.1d | Story 1 |
| AC-8.2 | TC-8.2a | Story 1 |
| AC-8.3 | TC-8.3a | Story 0 |
| AC-9.1 | TC-9.1a, TC-9.1b | Story 3 |
| AC-9.2 | TC-9.2a, TC-9.2b | Story 3 |
| AC-9.3 | TC-9.3a | Story 3 |
| AC-9.4 | TC-9.4a, TC-9.4b | Story 3 |

### Coverage Summary

| Metric | Count |
|--------|-------|
| ACs in epic | 38 |
| ACs covered | 38 |
| ACs split across multiple stories | 4 (AC-2.5, AC-3.4, AC-6.3, AC-8.1 — each splits between an early story that lands infrastructure and a later story that closes the remaining TC) |
| TCs in epic | 54 |
| TCs covered | 54 |
| Unmapped TCs | 0 |
| Observed-run TCs (not programmatically testable) | 16 (TC-1.1a, TC-1.1b, TC-1.4a, TC-3.1a, TC-3.2a, TC-3.3a, TC-4.1a, TC-4.2a, TC-5.1a, TC-5.2a–d, TC-5.5a, TC-5.5b, TC-9.3a) |

All 38 ACs and 54 TCs are assigned. No orphans. Coverage gate passes.

---

## Integration Path Trace

Three end-to-end user paths matter in Epic 1. Each segment is traced to its owning story and a TC that exercises it.

### Path 1: Streamer Launches the App and Clicks Sign-In

The primary path Epic 1 delivers. The streamer launches the packaged app (or `pnpm start`), sees the landing view, and clicks the sign-in button. The renderer POSTs to `/auth/login`, receives a typed `NOT_IMPLEMENTED` error, and surfaces a message keyed to the error code.

| # | Segment | Owning Story | Relevant TC |
|---|---------|--------------|-------------|
| 1 | App launches, server starts, migrations apply, Electron window opens | Story 7 (+ Story 3 migrations) | TC-1.1b, TC-3.1a |
| 2 | Renderer mounts; landing view renders with product name, description, 5 capabilities, sign-in button | Story 5 | TC-1.2a |
| 3 | Landing mount issues zero outbound HTTP | Story 5 | TC-1.4b |
| 4 | User clicks sign-in; renderer issues `POST /auth/login` with `Origin: app://panel` | Story 5 | TC-1.3b |
| 5 | Server's Origin preHandler accepts `app://panel` | Story 4 | TC-6.2a |
| 6 | Session gate exempts `/auth/login` per `GATE_EXEMPT_PATHS` | Story 4 | TC-2.3a, TC-2.3c |
| 7 | Route handler throws `AppError('NOT_IMPLEMENTED')` | Story 2 | TC-6.2a (validated through the Origin-gated path in Story 4), TC-8.1c (direct envelope shape via `/oauth/callback` in Story 2) |
| 8 | Central error handler serializes envelope `{ error: { code: 'NOT_IMPLEMENTED', message } }` | Story 1 | TC-8.2a |
| 9 | Renderer parses envelope, `useSignIn` switches on code, `<ErrorEnvelopeCard>` surfaces user-visible text | Story 5 | TC-1.3c |

All 9 segments have a story owner and at least one TC. No gaps.

### Path 2: Streamer Attempts Direct Navigation to a Gated Route Unauthenticated

The gate path Epic 1 proves. A user (or test harness) navigates to `/home`, `/settings`, or any unknown path; the renderer redirects them to landing. The server side of the same gate returns 401 to HTTP requests on gated routes.

| # | Segment | Owning Story | Relevant TC |
|---|---------|--------------|-------------|
| 1 | Renderer router registers `/home`, `/settings` as gated via `defineRoute({ gated: true })` | Story 6 | TC-2.6a |
| 2 | User navigates to `/home`, `/settings`, or `/<unknown>` | Story 6 | TC-2.1a, TC-2.1b, TC-2.1c |
| 3 | `<RequireAuth>` reads `isAuthenticated()` → false; redirects to `/` with `state.redirectedFrom` | Story 6 | TC-2.5b |
| 4 | Landing renders; `<RedirectFlash>` shows "access denied · `<path>` requires authentication" | Story 5 (`<RedirectFlash>` component) + Story 6 (wiring) | TC-2.4a |
| 5 | Server side: any HTTP request to a gated route without a cookie returns 401 | Story 4 | TC-2.2a, TC-8.1a |
| 6 | State-changing request with bad Origin returns 403 before the session check | Story 4 | TC-7.2a, TC-7.4a, TC-8.1b |

All 6 segments have a story owner and at least one TC. No gaps.

### Path 3: Developer Runs `pnpm start`, Lands at Landing, Hot-Reloads a Renderer Change, and Ships a Packaged Build

The developer experience path. Validates dev modes, packaging, and CI.

| # | Segment | Owning Story | Relevant TC |
|---|---------|--------------|-------------|
| 1 | Fresh clone + `pnpm install` triggers `@electron/rebuild` via postinstall | Story 3 | TC-9.3a |
| 2 | `pnpm --filter client dev` — renderer-only mode serves landing in a browser | Story 5 | TC-1.4a, TC-3.3a |
| 3 | `pnpm --filter server dev` — server standalone responds on `127.0.0.1:7077` | Story 2 (TC-3.4a) + Story 4 (TC-3.4b, full route-policy observable) | TC-3.4a, TC-3.4b |
| 4 | `pnpm start` — full Electron app opens to landing | Story 7 | TC-1.1b, TC-3.1a |
| 5 | Renderer source edit is visible without Electron restart (HMR) | Story 7 | TC-3.2a |
| 6 | README lists all three dev-mode commands with use cases | Story 7 | TC-3.5a |
| 7 | `pnpm package` produces a host-OS artifact in `dist/packaged/` | Story 8 | TC-4.1a |
| 8 | Packaged artifact launches to landing | Story 8 | TC-4.2a (re-verifies TC-1.1a) |
| 9 | PR against `main` triggers CI on Ubuntu; `pnpm verify` runs | Story 9 | TC-5.1a, TC-5.2d |
| 10 | Failing CI blocks merge; push to main does not trigger CI | Story 9 | TC-5.5a, TC-5.5b |

All 10 segments have a story owner and at least one TC. No gaps.

---

## Cross-Story Dependency Summary

Derived from each story's Dependencies declaration. Read this as "Story N cannot start its Red commit until the left-hand stories' Green commit has landed."

```
Story 0  ── no dependency
Story 1  ── Story 0
Story 2  ── Story 1
Story 3  ── Story 1
Story 4  ── Story 1, Story 2
Story 5  ── Story 0 (Story 2 helpful but not required; component tests use mocked authApi)
Story 6  ── Story 5
Story 7  ── Story 3, Story 4, Story 6
Story 8  ── Story 7
Story 9  ── Story 0 (parallelizable with Stories 1–8)
```

Critical-path ordering: 0 → 1 → 2 → 4 → … and 0 → 5 → 6 → 7 → 8. Story 3 sits between 1 and 7. Story 9 runs in parallel.

---

## Validation

- [x] Every AC from the epic appears in a story file
- [x] Every TC from the epic appears in exactly one story file
- [x] Coverage gate table complete with no orphans
- [x] Integration path trace complete with no gaps
- [x] Split ACs (AC-2.5, AC-3.4, AC-6.3, AC-8.1) documented with per-TC story assignment
- [x] Observed-run TCs identified and counted
- [x] Story dependencies derived from each story's Dependencies declaration

Epic 1 story sharding is complete. Handoff-ready.

---

## Related Documentation

- Epic: [`../epic.md`](../epic.md)
- Tech design index: [`../tech-design.md`](../tech-design.md)
- Server companion: [`../tech-design-server.md`](../tech-design-server.md)
- Client companion: [`../tech-design-client.md`](../tech-design-client.md)
- Test plan: [`../test-plan.md`](../test-plan.md)
- UI spec: [`../ui-spec.md`](../ui-spec.md)
