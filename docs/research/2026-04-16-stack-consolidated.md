# Stack Research — Consolidated Findings

**Date:** 2026-04-16
**Status:** Supersedes the two prior reviews in this directory.
**Consumer:** `ls-arch` (and the author before starting `ls-arch`).

## 1. Purpose & Method

This document consolidates two independent stack-research passes —
one by Claude Opus 4.7 (`2026-04-16-stack-assessment.md`) and one by GPT
(`stack-research-2026-04-16.md`) — and reconciles them against a user
directive received after both were written: **no external Twitch
libraries**. Twitch integration will be hand-rolled.

The consolidation calls out:

- where the two reviews converge independently (high confidence),
- where they diverge (genuine trade-offs to resolve),
- what each review caught that the other missed, and
- how the "no external Twitch libs" directive changes the recommendation
  set.

This document does not settle the architecture. `ls-arch` does. The
starting hypothesis below is input, not commitment.

## 2. Where the Two Reviews Agree (Strong Consensus)

Two independent passes converged on the following. High confidence.

| Decision | Consensus pick | Rationale both reviews gave |
|---|---|---|
| Language | TypeScript end-to-end | Nothing in the PRD pushes against it; both reference repos and stack are TS-native |
| Monorepo tooling | pnpm workspace | Matches liminal-build; low-friction |
| Backend framework | Fastify on Node | Mature plugin ecosystem, strong TS support, Zod integration, long-lived WS friendly |
| Frontend framework | React + TypeScript | UI surface has enough moving parts (dashboard + live chat + CRUD + live state) that plain TS DOM becomes a liability |
| Bundler | Vite | Default for SPA + TS |
| Data layer | Managed Postgres (primary) | Domain is relational; multi-tenancy via query scoping is well-trodden |
| Database host | Neon | Managed Postgres, pooled connections, standard protocol |
| Validation | Zod | Both reviews accept as default |
| Tests | Vitest (+ Playwright for critical E2E) | Matches liminal-build tooling; no strong alternative |
| Lint/format | Biome | Faster and single-binary; matches liminal-build |
| EventSub transport | WebSocket (`wss://eventsub.wss.twitch.tv/ws`) | Fits stateful server model; avoids webhook handshake overhead |
| Convex as primary backend | Rejected | Actions are short-lived invocations with a 10-minute cap; cannot hold long-lived external WebSocket connections; adds lock-in without removing the hard part |
| Vercel Functions for core runtime | Rejected | Function-duration limits and shared FD cap fight long-lived connection ownership |
| Plain TS DOM (liminal-build style) | Rejected | UI surface area is larger than liminal-build's |

## 3. Where the Reviews Diverge (Trade-offs to Resolve)

Two genuine disagreements plus the user directive. Each resolved below.

### 3.1 Server → Browser live transport

- **Opus leaned WebSocket.** Bidirectional flexibility; client may
  eventually push live events (bot config hot reloads, mod-action
  ACKs).
- **GPT leaned Server-Sent Events (SSE).** Simpler; auto-reconnect;
  browser primarily needs *ordered server push*; mutating actions
  already fit ordinary HTTP.

**Resolution: SSE is the starting hypothesis.** The browser's live
needs are one-directional — chat stream, viewer count, chat restriction
state, mod action confirmations, welcome bot activity. Client-initiated
mutations (ban, chat settings, command edits, clip create) go through
normal HTTP POSTs. SSE is simpler, reconnect is HTTP-native, and no
bidirectional protocol is warranted for v1.

Keep WebSocket as a re-open-able alternative at `ls-arch` if a specific
feature surfaces a real bidirectional requirement.

### 3.2 Deployment host

- **Opus leaned Fly.io.** Regional deploy, small-team DX, cheap at
  small scale.
- **GPT leaned Render.** Render's docs explicitly document both inbound
  and outbound WebSocket support on web services — both directions
  matter here (EventSub outbound + SSE/WS inbound to the browser).

**Resolution: Render is the starting hypothesis, with Fly.io as an
equivalent second choice.** Both support the long-lived-stateful-server
pattern. Render's documented WebSocket story (both directions) is the
tiebreaker for a product whose operational backbone is persistent
connections. Fly.io remains a valid drop-in if multi-region or cost at
scale becomes a priority.

### 3.3 Twitch client libraries — superseded by user directive

- **Opus recommended Twurple** (`@twurple/auth` + `@twurple/api` +
  `@twurple/eventsub-ws`).
- **GPT did not recommend a library** — framed Twitch integration as
  "the server owns the connection" without naming a SDK.
- **User directive: no external Twitch libraries.** Hand-roll.

**Resolution: Twitch integration is hand-rolled.** §5 enumerates the
concrete scope. Twurple is not a dependency; its source code is a
reference to consult for edge cases if needed, but no code is imported.

## 4. What Each Review Caught That the Other Missed

Complementary, not contradictory.

**GPT caught:**

- **Twitch IRC is being decommissioned** per Twitch's changelog. This
  strengthens the EventSub-only direction — IRC is not a safe fallback.
  Chat must go through EventSub.
- **EventSub WebSocket has a 10-second subscribe window** after the
  welcome message before Twitch closes the socket. The reconnect code
  must subscribe fast or accept a re-connect loop.
- **Twitch does not replay lost events after a connection drop.**
  Reconnect must resync state from REST, not assume event continuity.
  This is the load-bearing reason for the cross-cutting "reconnect
  with REST state recovery" decision in the PRD.
- **Render's WebSocket support is documented both inbound and
  outbound.**
- **Vercel's shared file-descriptor cap** is a concrete limit
  (documented) that makes it a worse fit than function timeouts alone
  suggest.

**Opus caught:**

- **Twitch EventSub's per-session 300-subscription cap.** Relevant if
  our total subscription set per tenant approaches that — worth an
  inventory during `ls-arch`.
- **Per-Node-process tenant concurrency ceiling is unknown** —
  benchmark before it bites.
- **OBS future direction strengthens the long-lived-server case.**
  `obs-websocket` is another stateful external connection per tenant.
- **Token-at-rest encryption options** — `pgcrypto` column-level vs.
  application-level AES-GCM with platform-managed key. Lean
  application-level with a dedicated key management story.
- **Tenant isolation defense-in-depth** — Postgres row-level security
  plus query-scoping at the ORM layer, not either alone.
- **Specific Helix + EventSub scope mapping** across features.

## 5. Hand-Rolled Twitch Integration (New Section)

The user directive removes Twurple from scope. The integration splits
into five bounded modules. Scope named concretely below so it's clear
what we are — and aren't — building.

### 5.1 OAuth authorization-code flow

- Build `/oauth/login` route that redirects to Twitch authorize URL
  with `client_id`, `redirect_uri`, `scope`, `state` (signed UUID),
  and `response_type=code`.
- Build `/oauth/callback` route that validates `state`, exchanges
  `code` for access + refresh tokens via `POST
  https://id.twitch.tv/oauth2/token`, and creates/updates the tenant
  record.
- Scope set is enumerated across F3–F6 before F2 epic is finalized
  (per PRD A3).

### 5.2 Token refresh loop

- Per-tenant scheduler that refreshes access tokens ahead of expiry
  (~5 minutes before `expires_in`) via `POST
  https://id.twitch.tv/oauth2/token` with `grant_type=refresh_token`.
- Handle revocation (401 from Helix or error from refresh endpoint)
  by terminating the tenant's active session and prompting re-auth.
- Tokens encrypted at rest (application-level AES-GCM).

### 5.3 Helix REST client

A typed HTTP wrapper with auth-header injection, pagination, and
rate-limit awareness. No SDK dependency.

Endpoints we call in v1:

| Endpoint | Feature | Notes |
|---|---|---|
| `PATCH /helix/channels` | F3 | Edit title, game, tags, language, CCL, branded-content |
| `GET /helix/channels` | F3 | Read current channel info |
| `GET /helix/creator_goals` | F3 | Read-only goals |
| `GET /helix/moderation/moderators` | F3 | List mods |
| `POST /helix/moderation/moderators` | F3 | Add mod (scope `channel:manage:moderators`) |
| `DELETE /helix/moderation/moderators` | F3 | Remove mod |
| `GET /helix/moderation/banned` | F3, F4b | List bans |
| `POST /helix/moderation/bans` | F4b | Ban/timeout |
| `DELETE /helix/moderation/bans` | F3, F4b | Unban |
| `DELETE /helix/moderation/chat` | F4b | Delete chat message |
| `PATCH /helix/chat/settings` | F4b | Slow/subs/followers/emote-only |
| `GET /helix/channels/followers` | F3 | Paginated |
| `GET /helix/subscriptions` | F3 | Paginated |
| `POST /helix/clips` | F4c | Create clip around now |
| `POST /helix/chat/messages` | F5, F6 | Send chat as broadcaster |
| `GET /helix/streams` | F4a | Initial live state on connect |

Rate-limit handling: inspect `Ratelimit-Remaining` and `Ratelimit-Reset`
response headers, pace paginated reads.

### 5.4 EventSub WebSocket client

Per-tenant long-lived WebSocket to `wss://eventsub.wss.twitch.tv/ws`.
Responsibilities:

- **Session lifecycle.** Receive `session_welcome`, subscribe to all
  tenant-relevant topics within the 10-second window via `POST
  /helix/eventsub/subscriptions`, then enter event-handling loop.
- **Keepalive.** Handle `session_keepalive` (idle heartbeat);
  disconnect-and-reconnect if keepalive silence exceeds the advertised
  `keepalive_timeout_seconds`.
- **Reconnect.** On `session_reconnect`, transition to the new URL from
  the message without dropping state; on unexpected close, reconnect
  with exponential backoff.
- **State recovery.** After any reconnect, REST-fetch current state for
  each live surface (stream status, chat settings, goals, ban list) so
  the UI resyncs from truth instead of guessing.
- **Deduplication.** Dedupe by `Twitch-Eventsub-Message-Id` to absorb
  at-least-once retries.

Topics we subscribe to (set per tenant, right-sized to features
currently active):

| Topic | Features | Notes |
|---|---|---|
| `stream.online` / `stream.offline` | F4a | Live detection |
| `channel.chat.message` | F4a, F5, F6 | Requires `user:read:chat` |
| `channel.chat.message_delete` | F4a, F4b | Live mod delete visibility |
| `channel.chat_settings.update` | F4b | Restrictions-state sync |
| `channel.follow` | F3 (live) | Live follower count context |
| `channel.subscribe` | F3 (live) | Live subscriber context |
| `channel.goal.begin` / `.progress` / `.end` | F3 | Live goal updates |
| `channel.moderator.add` / `.remove` | F3 | Mod list sync |
| `channel.ban` / `.unban` | F3, F4b | Banned list sync |

Total per-tenant subscription count: ~13. Well inside Twitch's
300-per-session cap.

### 5.5 Chat send

- Single wrapper around `POST /helix/chat/messages` used by F5 (command
  responses) and F6 (welcome messages).
- Broadcaster-identity-authed per the PRD's v1 bot decision.
- Returns clipped-response semantics if Twitch rejects (message too
  long, rate limit, etc.).

### 5.6 Scope of the hand-roll (rough)

~1-2 weeks of focused TS work for the full integration across all five
modules. The product reference surface is concrete (above tables) and
the Twitch docs are sufficient. Twurple's source remains available as a
reference implementation to consult for edge cases without importing
it.

## 6. PRD-Driven Constraints That Anchored the Decisions

Restated from the PRD for easy reference:

- Hosted multi-tenant web app; one streamer per tenant.
- Twitch OAuth authorization-code flow with refresh.
- Long-lived per-tenant EventSub WebSocket with intelligent handling:
  per-tenant session, right-sized subscriptions, reconnect with REST
  state recovery, dedup by `message_id`, visible reconnect UX.
- Rate-limit-aware Helix interaction.
- Live data streamed from server to browser during live streams.
- Persistent data: tenants, encrypted tokens, commands, chatter history
  keyed on `user_id`, recent clips.
- Streamer-only route gating enforced centrally.
- Longer-term direction: "one stop shop for streaming" — OBS/production
  may arrive in v2+, reinforcing the stateful-server requirement.

## 7. Consolidated Starting Hypothesis

Not a commitment — input to `ls-arch`.

| Layer | Starting hypothesis | Source |
|---|---|---|
| Language | TypeScript | Consensus |
| Runtime | Node.js 22 LTS | Consensus |
| Monorepo | pnpm workspace | Consensus |
| Backend | Fastify 5 | Consensus |
| Frontend | React + Vite + TS, SPA + static landing | Consensus |
| Component library | shadcn/ui (tentative) | Opus; open at `ls-arch` |
| Data layer | Postgres (primary) | Consensus |
| Database host | Neon | Consensus |
| ORM/query | Drizzle (leading candidate) | Open at `ls-arch` |
| Token-at-rest | Application-level AES-GCM, platform-managed key | Opus |
| Twitch integration | Hand-rolled, no SDK dependency | User directive |
| EventSub transport | WebSocket | Consensus |
| Server → browser | SSE | GPT recommendation, accepted |
| Auth session | `iron-session` or `@fastify/secure-session` | Opus |
| Validation | Zod 4 | Consensus |
| Tests | Vitest + Playwright (critical E2E) | Consensus |
| Lint/format | Biome | Consensus |
| Deploy host | Render (primary), Fly.io (equivalent alternative) | GPT primary, Opus alternative |

## 8. Open Questions for `ls-arch`

1. **ORM choice.** Drizzle, Kysely, Prisma, or thin SQL. Drizzle is the
   leading candidate for fit with Zod and low runtime overhead; Kysely
   if we want SQL-first typing; Prisma has the largest ecosystem but
   heaviest runtime.
2. **Tenant isolation enforcement.** Row-level security in Postgres,
   query-scoping in the ORM layer, or both. Recommend both for defense
   in depth; `ls-arch` documents the pattern.
3. **Session model.** Encrypted stateless cookies (simpler) vs. server-
   backed session table (better invalidation control). Product risk is
   low; stateless cookies likely fine.
4. **Component library commitment.** shadcn/ui vs. Mantine vs. Radix
   primitives vs. hand-rolled. Decide at `ls-arch` based on team
   preference.
5. **Job queue.** Needed for retry of failed chat sends, backfill tasks,
   scheduled token refresh sweeps? Possibly Postgres-backed (PgBoss) or
   Redis-backed (BullMQ). Defer until there's a concrete need — v1 may
   not require it.
6. **Single-node vs. multi-node.** At what tenant volume do we need to
   shard the EventSub WebSocket workload across multiple Node
   processes? Benchmark before it bites.
7. **Secret management.** Render/Fly secrets for v1 vs. separate KMS.
   Platform secrets are fine unless we grow to multi-region or need
   rotation beyond what platform secrets offer.
8. **Browser live transport recheck.** SSE is the starting hypothesis;
   confirm at `ls-arch` that no feature requires bidirectional — if one
   does, WebSocket is the swap target.

## 9. Risks & Invalidators

Named so `ls-arch` can watch for them.

- **Twitch 300-subscription cap.** We're at ~13 per tenant today; safe.
  If v2 adds many more event types, the budget tightens.
- **Per-process tenant concurrency ceiling.** Unknown; must benchmark.
  Affects when horizontal sharding becomes necessary.
- **Hand-roll Twitch integration cost.** Bounded (~1-2 weeks) but real.
  Compensating benefit is zero external surface area and full control
  of error handling, rate limiting, and reconnect semantics.
- **SSE reverse-proxy gotchas.** Some proxies buffer SSE; we'll need to
  set `Cache-Control: no-cache` and `X-Accel-Buffering: no` where
  relevant. Render documents SSE support; confirm at deploy.
- **OBS future direction.** Strengthens stateful-server case; the
  recommended stack accommodates.
- **Self-hosting reappears.** Ruled out by PRD for v1. If ever
  reversed, the Postgres + Fastify + Render/Fly recommendation ports
  cleanly; a Convex-based stack would not.
- **Twitch IRC decommission.** Confirmed by GPT's changelog check.
  Strengthens the EventSub-only chat direction; no IRC fallback planned.

## 10. Final Answer

Stack direction is ready to enter `ls-arch`. Summary of what this
consolidation changes from each prior review:

**Changes from Opus's review:**
- Twurple dependency removed; Twitch integration hand-rolled.
- Server→browser transport changed from WebSocket to SSE as starting
  hypothesis.
- Primary deploy host changed from Fly.io to Render (Fly.io retained
  as equivalent alternative).

**Changes from GPT's review:**
- Concrete Twitch API surface and module scope added (§5), so "server
  owns the Twitch connection" is no longer a hand-wave.
- Twurple removed as even an implicit option.
- Subscription count inventory (~13 per tenant) added so the
  300-per-session cap can be reasoned about.
- Token-at-rest encryption and tenant isolation defense-in-depth
  specifics surfaced.

**Stable across both reviews:**
- TypeScript + pnpm + Fastify + React + Vite + Postgres + Neon + Zod +
  Vitest + Biome.
- Rejection of Convex as primary backend and Vercel for core runtime.
- EventSub WebSocket as Twitch transport.
- Long-lived stateful server as the non-negotiable shape.

## Appendix A — Source Inputs

- `docs/research/2026-04-16-stack-assessment.md` (Opus review)
- `docs/research/stack-research-2026-04-16.md` (GPT review)
- `docs/prd.md` (product constraints)
- `docs/braindump.md` (initial idea capture)
- Twitch developer documentation (EventSub, Helix, changelog)
- Fastify, React, Vite, Neon, Render, Convex, Vercel official docs
  (as cited in source reviews)
