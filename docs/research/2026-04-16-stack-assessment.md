# Stack Assessment — Pre-Architecture Research

**Date:** 2026-04-16
**Consumer:** `ls-arch` (and the author before they start `ls-arch`)
**Purpose:** Surface whether the stack direction implicit in the PRD and
the liminal-build reference is the right starting hypothesis for this
specific product, or whether one or more pieces should be reconsidered
before architecture is committed.

This document does not settle the architecture — that is `ls-arch`'s job.
It enumerates stack decisions, scores candidates against the product's
actual demands (from the PRD), and recommends a starting hypothesis plus
the open questions and risks `ls-arch` should carry forward.

---

## 1. What the PRD Demands of the Stack

The PRD commits the product to specific behaviors that constrain stack
choice. Extracted and consolidated here:

- **Hosted multi-tenant web app.** One streamer per tenant, tenant =
  Twitch broadcaster identity. Tenant isolation enforced at the data
  layer.
- **Twitch OAuth authorization-code flow.** Not OIDC-standard; Twitch
  OAuth returns access + refresh tokens, not OIDC ID tokens by default.
- **Live stream operations via Twitch EventSub.** Stream start/end,
  live chat, follows, subs, goal progress. Cross-cutting decision
  committed the panel to "intelligent EventSub handling": per-tenant
  session, right-sized subscriptions, reconnect with REST state
  recovery, deduplication by `message_id`.
- **Helix REST client** for channel info edits (`PATCH /helix/channels`),
  mod/ban actions, clip creation, chat message send, followers/subs
  reads, goal reads.
- **Low-latency client-side updates during streams.** Live chat
  rendering, viewer count, mod action state, chat restriction state.
  NFR target: "feels live" within Twitch's delivery envelope.
- **Persistent data.** Tenants, encrypted Twitch tokens, channel config
  cache, commands, chatter history keyed on `user_id`, recent clips,
  role assignments.
- **Streamer-only route gating** enforced centrally, not per route.
- **Rate-limit-aware Helix interaction.** Bulk reads paced.
- **Eventually: "one stop shop for streaming"** (Future Directions
  include OBS/production control, which typically needs another
  long-lived external WebSocket client — `obs-websocket`).

Two of these constraints dominate the stack shape:

1. **Long-lived per-tenant EventSub WebSocket client** — the server must
   hold stateful outbound connections to Twitch. This rules out pure
   serverless/edge runtimes unless we switch to EventSub webhooks (see
   §5).
2. **"One stop shop" direction** — future OBS integration extends the
   long-lived-external-client pattern. The stack should assume stateful
   server is permanent, not temporary.

---

## 2. Backend Framework & Runtime

### Candidates

| Option | Language/Runtime | Fit notes |
|---|---|---|
| **Fastify on Node.js** | TS / Node | Mature, plugin ecosystem, Zod integration, long-lived WS friendly |
| Express on Node | TS / Node | Older, larger ecosystem but Fastify strictly supersedes it for new projects |
| NestJS on Node | TS / Node | Heavy; opinionated DI; valuable for very large teams, overkill here |
| Hono on Node/Bun/Edge | TS / any | Fast, modern, but edge-oriented — our long-lived WS pushes back on edge runtime fit |
| Elysia on Bun | TS / Bun | Fast, young ecosystem; Bun maturity risk |
| Next.js API routes | TS / Vercel-ish | Edge/serverless model fights long-lived WS; would force EventSub webhook path |

### Recommendation

**Fastify on Node.js.** It is the default-correct pick for a stateful
TypeScript backend with a Zod-heavy validation story. Hono is tempting
for its lean shape but the edge-runtime bias works against the
long-lived EventSub client. NestJS is too much framework for a team
that already has opinions about architecture.

### Open questions

- Node.js LTS version target — 22.x is the current LTS; `ls-arch`
  confirms.
- Bun as an alternative runtime later — not a v1 decision.

---

## 3. Frontend Framework

### Candidates

| Option | Fit notes |
|---|---|
| **React + TypeScript** | Default for this UI surface area; mature ecosystem |
| Solid | Fine-grained reactivity (good for live chat rendering), smaller ecosystem |
| Svelte / SvelteKit | Elegant; SvelteKit's SSR model needs consideration for stateful backend |
| Plain TS DOM (liminal-build style) | Viable for small UIs; likely painful for live chat + dashboards + CRUD surfaces |
| Vue | Valid; smaller community traction in this domain |

### Product-driven requirements

- Live chat rendering at stream volume (potentially dozens of
  messages/sec)
- CRUD surfaces for commands, welcome message, channel info
- Dashboards showing live viewer count, chat state, restriction state
- Multiple reactive sub-components on the live view

Plain-TS-DOM ran liminal-build successfully because liminal-build's UI
surface is narrower. This product's live view alone would require
hand-rolled reactive primitives that a framework gives for free.

### Recommendation

**React + TypeScript.** Pragmatic default. Solid is a serious
alternative if we want fine-grained reactivity for live chat rendering
specifically — worth an `ls-arch`-stage spike. Plain TS DOM is almost
certainly the wrong call given the UI surface.

### Open questions

- SSR/SSG needed? The landing page is public; everything else is
  authenticated SPA. SSR is nice-to-have, not required. Likely SPA +
  static landing page.
- Component library — shadcn/ui, Mantine, Radix primitives, Chakra,
  hand-rolled. `ls-arch` settles. Time-to-value leans shadcn/ui.
- Bundler — Vite is the right default for SPA + TS.

---

## 4. Data Layer

This is the decision most worth scrutinizing, because the liminal-build
reference points at **Convex** and Convex's fit for this specific product
is not obvious.

### What Convex is good at

- Reactive queries from client: the client subscribes to a query and
  automatically re-runs on data changes. Zero WebSocket plumbing on our
  side for query subscriptions.
- Typed schema + generated TS types end-to-end.
- Handles its own hosting, scaling, backups.
- Strong mutation-as-function model; ergonomic multi-tenancy via
  auth-scoped mutations.

### Where Convex is a poor fit for this product

- **Actions are short-lived invocations**, not long-running processes.
  Convex cannot hold a long-lived outbound WebSocket to Twitch EventSub.
- **Auth model assumes OIDC ID-token providers.** Twitch OAuth is
  OAuth 2.0 with access/refresh tokens; not OIDC-native. Convex can be
  adapted with a custom auth bridge, but we lose some of Convex's auth
  ergonomics.
- **Vendor lock-in.** Queries, mutations, actions are Convex-specific
  code. Migration out later is non-trivial.
- **Reactive queries are less load-bearing than they first appear for
  this product.** The panel's real-time data comes from Twitch
  EventSub, not from streamer-side writes. The reactive-query superpower
  mostly matters for collaborative apps, which this isn't — one
  streamer, their own tenant.

### Using Convex anyway — two viable paths

**Path A: Convex + a separate long-lived Node worker.** Worker holds
EventSub WebSocket connections per tenant and calls Convex mutations on
incoming events. Client subscribes reactively to Convex queries, which
auto-refresh. Trade-off: we now run *two* backends (Convex + worker)
and have to coordinate auth + deployment for both.

**Path B: Convex + EventSub webhooks.** Skip WebSocket EventSub entirely
and have Twitch POST to a public HTTPS endpoint backed by a Convex HTTP
action. Serverless-friendly, fits Convex's model cleanly. Trade-off:
webhook handshake ceremony, per-subscription callback URL management,
and we lose the "the panel holds a live connection" feel — events come
through Twitch's push infrastructure at Twitch's latency budget.

### Alternative: Postgres + Drizzle + the Fastify server

A single stateful backend that owns tokens, Twitch integration (EventSub
WS + Helix), persistence (Postgres), and real-time push to client
(WebSocket). Simpler mental model, zero lock-in, no two-backend
coordination problem. Real-time to the client is our own WebSocket hub
fed by EventSub events and by Helix state changes.

Downsides vs. Convex:
- We build our own reactivity-to-client layer (but the cross-cutting
  decision already commits us to a WebSocket live hub with REST fallback
  — this work is happening regardless).
- Manual migrations, schema management, and queries.

### Recommendation

**Starting hypothesis: Postgres + Drizzle + Fastify + a custom WebSocket
hub to the client.** Simpler fit for the product's actual shape
(stateful long-lived server + persistent store + live push from server
to client). Convex's superpowers don't earn their lock-in here.

`ls-arch` should pressure-test this against Path B (Convex + EventSub
webhooks) specifically if Convex's operational simplicity is highly
valued. Path A (Convex + worker) I would not recommend — worst of both
worlds.

### Open questions for `ls-arch`

- Postgres host: Neon vs. Supabase vs. Render Postgres vs. self-hosted.
  Neon's branching is nice-to-have for dev/staging separation.
- Migrations: Drizzle Kit, node-pg-migrate, Atlas. Drizzle Kit is the
  default pair for Drizzle.
- Token-at-rest encryption: `pgcrypto` column-level vs. application-
  level AES-GCM with a KMS-managed key. Lean toward application-level
  with a dedicated key management story.

---

## 5. Twitch Client Libraries

### Candidates

- **Twurple** (`@twurple/*` scoped packages) — TypeScript-first, covers
  auth (`@twurple/auth`), Helix REST (`@twurple/api`),
  EventSub WebSocket (`@twurple/eventsub-ws`), EventSub HTTP/webhook
  (`@twurple/eventsub-http`), chat (`@twurple/chat`). Active project.
- Hand-rolled Helix + EventSub — more work, total control.
- `tmi.js` — IRC chat only; does not align with our EventSub-chat
  direction.

### Twurple fit per product need

| Need | Twurple package | Notes |
|---|---|---|
| OAuth auth-code flow + refresh | `@twurple/auth` | Handles token lifecycle including auto-refresh |
| Helix REST calls | `@twurple/api` | Typed, paginated, rate-limit-aware |
| EventSub WS per tenant | `@twurple/eventsub-ws` | Session + reconnect + subscription lifecycle |
| EventSub webhook (if we go that way) | `@twurple/eventsub-http` | Handles Twitch's webhook handshake |
| Chat send/receive | `@twurple/chat` uses IRC (tmi-compatible); for chat-via-EventSub we wire `channel.chat.message` through `@twurple/eventsub-ws` and send via Helix `POST /helix/chat/messages` | Cross-check |

### Recommendation

**Twurple, specifically `@twurple/auth` + `@twurple/api` +
`@twurple/eventsub-ws`.** Reject `@twurple/chat` for this product — it
is IRC-based and we committed to EventSub `channel.chat.message` via
A1 and the cross-cutting decision. Chat send goes through Helix's
`Send Chat Message` endpoint, which `@twurple/api` covers.

### Open questions

- Confirm `@twurple/api` exposes `Send Chat Message` cleanly, or
  whether we wrap a raw fetch for it.
- Twurple's rate-limit handling behavior under burst — may need to
  augment with our own limiter for bulk pagination (§NFR rate-limit
  awareness).

---

## 6. EventSub Transport: WebSocket vs. Webhook

This choice cascades into §2 (backend framework) and §4 (data layer).

### EventSub WebSocket

- Our server holds one outbound WS per active tenant
- No public HTTPS endpoint needed for Twitch to reach us
- Session-based: welcome → subscribe → events → keepalive (every ~10s)
  → session_reconnect on server-initiated rotation
- Single session caps at 300 subscriptions (per Twitch), plenty for one
  tenant's needs
- Requires a long-lived server process — not serverless-friendly
- Simpler conceptual model; we own the connection lifecycle

### EventSub Webhook

- Twitch POSTs to our public HTTPS endpoint
- One-time webhook-callback-verification handshake per subscription
- Twitch-managed delivery with retries; at-least-once semantics
- Works on serverless (Vercel functions, Cloud Run HTTP, Convex HTTP
  actions)
- Per-subscription callback URL management overhead
- Twitch enforces subscription limits; some topics have cost/rate
  constraints

### Recommendation

**WebSocket.** Fits our committed long-lived-server direction,
avoids webhook handshake ceremony, keeps operational surface smaller.

If the architecture later shifts to serverless-heavy (unlikely given
the OBS future direction), revisit.

### Open questions

- Per-tenant WS vs. shared session across tenants — Twitch's per-user
  session model suggests per-tenant. `ls-arch` confirms.
- How many concurrent tenant sessions one Node process can hold before
  saturation — empirical, benchmark during `ls-arch` or story phase.

---

## 7. Server-to-Client Live Channel

Two components push from server to browser during a live stream: chat
messages, stateful updates (viewer count, chat restriction state, mod
action results).

### Candidates

- **WebSocket (`ws` library, or Fastify `@fastify/websocket`)** —
  bidirectional, mature, matches the liminal-build pattern
- **Server-Sent Events (SSE)** — one-way server→client, simpler,
  natively buffered, auto-reconnect; cannot receive client-initiated
  messages on same channel
- **Long-polling** — fallback, not a primary

### Recommendation

**WebSocket.** The client may eventually send events (e.g., mod-action
ACKs, typing state, bot-config hot reloads). Bidirectional flexibility
is worth it. SSE is a reasonable v1 simplification if we're sure we
never need client→server live — but we probably will.

---

## 8. Auth & Sessions

### Candidates

- **`@fastify/secure-session` or `iron-session`** — encrypted
  cookie-based sessions, stateless on server, good for this use
- **Lucia** — modern OAuth + session library, ergonomic, supports
  custom providers
- **Auth.js (NextAuth)** — tied to Next.js idioms, poor fit for
  Fastify
- **Hand-rolled session table in Postgres** — most control, most work

### Recommendation

**`iron-session` or `@fastify/secure-session` + hand-rolled Twitch
OAuth flow via `@twurple/auth`.** Lucia is a strong alternative if we
want a more opinionated library. Twitch OAuth is not complicated enough
to need a heavy framework.

### Open questions

- Session TTL — the PRD says "survives browser close/reopen within TTL."
  Suggest 30 days with refresh on activity; `ls-arch` confirms.
- Tenant session fixation: rotate session ID on login and sensitive
  actions (standard hygiene).

---

## 9. Deployment Target

Long-lived WebSocket client + long-lived WebSocket server + Node
backend. Rules out edge-first platforms.

### Candidates

| Option | Fit |
|---|---|
| **Fly.io** | Small team-friendly, long-lived connections work, regional deploy, cheap at small scale |
| **Render** | Similar, slightly less flexible region-wise |
| **Railway** | Friendly DX, good for this shape |
| **Cloud Run (GCP)** | Long-lived connections supported but need tuning (min instances, timeout); not its sweet spot |
| **ECS/Fargate (AWS)** | Fine; more setup |
| **Traditional VPS** | Viable; more operational burden |
| **Vercel** | Not a good fit — edge/serverless model fights long-lived WS |

### Recommendation

**Fly.io as starting hypothesis.** Good balance of DX and price for a
small stateful TS service. Railway is the close second.

### Open questions

- Postgres host co-located or separate from app host (latency matters
  for request-path queries).
- Secrets management: platform-native vs. separate KMS.

---

## 10. Validation, Monorepo, Testing, Lint

Quick takes — these are not hot decisions.

- **Validation:** Zod 4. Fine. Valibot is lighter if bundle size matters
  on the client; Zod is the safer default.
- **Monorepo:** pnpm workspace. If task orchestration gets painful,
  add Turborepo. Don't pre-emptively.
- **Testing:** Vitest for unit/integration. Playwright for critical E2E
  (OAuth round-trip, live chat render under load).
- **Lint/format:** Biome or ESLint+Prettier. Biome is faster and
  single-binary; ESLint has the deeper ecosystem. Biome for a small team
  that wants speed.

---

## 11. Starting Hypothesis (Consolidated)

Not a commitment — input to `ls-arch`.

| Layer | Starting hypothesis |
|---|---|
| Runtime | Node.js 22 LTS |
| Backend framework | Fastify 5 |
| Frontend framework | React + TypeScript, Vite bundler, SPA + static landing page |
| Component library | shadcn/ui (decide at `ls-arch`) |
| Data layer | Postgres (Neon host) + Drizzle ORM |
| Migrations | Drizzle Kit |
| Token-at-rest | Application-level AES-GCM, key from platform secret manager |
| Twitch libs | `@twurple/auth` + `@twurple/api` + `@twurple/eventsub-ws` |
| EventSub transport | WebSocket |
| Server-to-client | WebSocket (`@fastify/websocket`) |
| Auth session | `iron-session` or `@fastify/secure-session` |
| Validation | Zod 4 |
| Monorepo | pnpm workspace, Turbo later if needed |
| Tests | Vitest + Playwright for critical E2E |
| Lint/format | Biome |
| Deploy | Fly.io |

---

## 12. Open Questions for `ls-arch`

1. **Data layer re-evaluation.** Is the Convex path (specifically Path B
   — Convex + EventSub webhooks) attractive enough to prefer over
   Postgres + Fastify? Trade is operational simplicity (Convex manages
   infra) for lock-in and a webhook-shaped EventSub model.
2. **Frontend framework confirmation.** React is the safe default;
   Solid's fine-grained reactivity may pay off specifically for live
   chat rendering. Spike-worthy if live chat perf becomes a concern.
3. **Tenant isolation enforcement.** Row-level security in Postgres,
   query-scoped by tenant ID in Drizzle, or both (defense in depth).
   Pick and document.
4. **EventSub WS tenant concurrency.** How many concurrent tenant
   sessions one Node process can hold before we need to shard. Benchmark
   before scale bites.
5. **Session storage.** Stateless encrypted cookies (simpler) vs. server-
   side session table (more control over invalidation). Product is
   low-risk, stateless cookies probably fine.
6. **Secret management.** Fly.io secrets are fine for v1; separate KMS
   becomes interesting only if we grow to multi-region or need rotation
   policies beyond what platform secrets offer.

---

## 13. Risks & Invalidators

Named so `ls-arch` can watch for them.

- **Convex advocacy.** If the team has strong Convex experience, Path B
  (Convex + webhooks) should be weighed seriously; the Postgres
  recommendation is based on fit, not on team expertise.
- **Twitch EventSub rate limits.** If per-tenant subscription volume
  exceeds Twitch's single-session cap (300), we need sharding. Check
  our subscription set total before committing to single-session-per-
  tenant.
- **Multi-tenant data volume.** A streamer with years of chatter
  history could accumulate millions of rows. Postgres is fine here with
  indexing; Convex would need schema sharding per tenant. Not a hot
  issue for v1 but a risk to the Convex path longer-term.
- **OBS future direction.** If OBS/production control becomes v2, the
  long-lived-external-client pattern strengthens. The recommended
  stack already accommodates this; the Convex path gets harder.
- **Self-hosting reappears.** If the product direction shifts toward
  self-hosting (ruled out for v1 per PRD), Convex is immediately
  disqualified — it requires Convex's managed infrastructure. Postgres
  + Fastify is portable.

---

## 14. Relationship to `ls-arch`

This document does not settle the architecture. It gives `ls-arch`:
- An enumerated decision set
- Product-driven constraints per decision
- Candidate evaluations
- A starting hypothesis that can be confirmed, adjusted, or replaced
- Risks to carry forward

`ls-arch` may adopt the hypothesis wholesale, replace individual
components, or reject the direction entirely with documented rationale.
The work here is intended to shorten `ls-arch`'s research loop, not
constrain its conclusions.
