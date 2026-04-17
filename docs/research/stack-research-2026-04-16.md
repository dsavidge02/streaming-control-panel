# Stack Research Before Architecture

Date: 2026-04-16

## Goal

Determine whether we have identified the right stack family before moving into the technical architecture phase, and whether any current leanings should be changed now instead of later.

## Inputs Reviewed

- Current workspace PRD: `C:\github\streaming-control-panel\docs\prd.md`
- Project notes: `C:\github\streaming-control-panel\braindump.md`
- Reference stack shape from `C:\github\liminal-build`
- Current official Twitch, Fastify, React, Vite, Convex, Render, Neon, and Vercel docs

## Executive Conclusion

Yes: we have enough information to identify the correct stack family before architecture.

The most efficient v1 stack is:

- TypeScript end-to-end
- `pnpm` monorepo
- React + Vite on the client
- Fastify on a long-running Node service for the backend
- Managed Postgres as the primary database
- A long-running web service host, with Render as the strongest researched default
- Server-owned Twitch EventSub WebSocket connection
- Server-to-browser live updates via SSE or WebSocket, with HTTP snapshot fallback
- Zod, Vitest, and Biome as supporting tooling

The main thing to avoid is a serverless-first or Convex-first architecture for the core runtime. That choice would work against the PRD's most important operational constraint: persistent, reconnect-aware Twitch event handling.

## Why The PRD Narrows The Stack

The current PRD already commits the system to a few high-leverage realities:

- The server owns Twitch API interaction, EventSub subscriptions, token storage, and tenant data.
- Live behavior matters: chat, moderation, clip creation, chat restriction state, reconnect, and state resync.
- The product is hosted and multi-tenant, but v1 is still a single-surface streamer app, not a large public consumer site.
- Mid-stream latency and reconnect correctness matter more than edge rendering tricks or SEO.

That combination strongly favors an always-on application server over a stateless request-only platform.

## Current Platform Research

### 1. Twitch now pushes us toward an always-on integration service

This is the strongest signal in the whole research pass.

Current Twitch docs show:

- EventSub WebSocket requires connecting to `wss://eventsub.wss.twitch.tv/ws`.
- After the welcome message, the client has 10 seconds by default to subscribe before Twitch closes the socket.
- If the connection is lost, the client must reconnect and resubscribe.
- Twitch does not replay lost events after a dropped connection.
- Reconnect handling is explicit and must be implemented correctly to avoid message loss.
- `channel.chat.message`, `channel.chat.message_delete`, and `channel.chat_settings.update` all exist as official EventSub types.
- Twitch's changelog now reflects the post-IRC world; the IRC decommission is already documented, which reinforces EventSub instead of a legacy IRC-first stack.

This means the backend is not just an API facade. It is a connection manager and event-processing runtime. That sharply reduces the appeal of serverless-first platforms for the core app.

## Candidate Stack Options

### Option A: Keep the liminal-build shape almost as-is

Shape:

- Fastify
- Vite
- plain TypeScript DOM client
- Convex

Assessment:

- Fastify still looks good.
- Vite still looks good.
- Plain TS DOM no longer looks like the best default.
- Convex no longer looks like the best primary backend/database runtime.

Why only a partial match:

- The PRD now has enough UI surface area that a component model is worth the cost: landing/auth shell, channel settings, paginated read surfaces, live chat, moderation actions, command management, welcome-bot config, chatter history.
- Convex actions are serverless functions. Official docs describe actions as normal serverless functions and note a 10-minute timeout. That is fine for discrete jobs, but not a great fit for the app's long-lived Twitch socket/session manager.
- Convex HTTP actions can receive webhooks and expose an HTTP API, but they do not give us a clean reason to move the core integration runtime there when the app already needs a persistent server process.

Conclusion:

- Keep Fastify, Vite, TypeScript, Zod-style validation, testing, and monorepo discipline.
- Do not treat plain TS DOM + Convex as the default stack for this product.

### Option B: Long-running TypeScript app with React + Fastify + Postgres

Shape:

- React + Vite frontend
- Fastify backend
- Managed Postgres
- Long-running service deployment

Assessment:

- Best fit for the PRD
- Best fit for Twitch EventSub operational reality
- Best fit for delivery speed without painting the architecture into a corner

Why it fits:

- Fastify is Node-first, performance-oriented, TypeScript-friendly, and has a mature plugin ecosystem including cookies, sessions, env validation, PostgreSQL integration, and WebSocket support.
- React is a strong fit for a dashboard-style UI with multiple coordinated stateful surfaces. React's own docs emphasize state structure, lifting state, and scaling state as an application grows; that maps directly to this product's client complexity.
- Vite remains the best default frontend build tool here. Its official docs still emphasize near-instant dev startup, HMR, and an architecture designed to evolve with the web platform long-term.
- Postgres is the safest primary system of record for tenants, OAuth tokens, commands, chatter history, clip records, and operational audit data.

Conclusion:

- This should be the default direction going into architecture.

### Option C: Hono or edge-first/serverless-first stack

Shape:

- Hono
- edge/serverless deployment bias
- possibly paired with serverless database products

Assessment:

- Good technology, wrong center of gravity for this product

What Hono does well:

- Official docs position it as lightweight, multi-runtime, Web-standards-based, and portable across edge and serverless environments.

Why it is not the best default here:

- The product's hardest problem is not route handling speed or runtime portability.
- The product's hardest problem is reliable ownership of Twitch connections, auth scopes, reconnect behavior, tenant isolation, and state recovery.
- A Node-first backend with richer existing operational patterns is the lower-risk choice.

Conclusion:

- Hono is a valid alternative, but not the most efficient starting point for this app unless cross-runtime portability becomes a top-level requirement.

## Frontend Recommendation

Recommend:

- React
- Vite
- TypeScript

Do not recommend as the default:

- plain TS DOM
- Next.js-style full-stack SSR framework

Reasoning:

- Plain TS DOM is still viable for very small apps. This app is no longer small enough to make that the efficient choice.
- The live control panel has enough moving parts that a declarative component/state model will pay for itself quickly.
- The app is streamer-only and authenticated. There is little evidence in the PRD that SSR or SEO should drive the stack.

Inference from the sources:

- React is not required by Twitch or by any hosting platform here.
- React is recommended because the PRD implies a moderately complex dashboard UI, and React is more maintainable than hand-rolled DOM state for that shape of app.

## Backend Recommendation

Recommend:

- Fastify on Node

Why:

- Fastify's official docs still emphasize speed, TypeScript readiness, and a large plugin ecosystem.
- The plugin ecosystem directly covers the kinds of concerns this app has: env/config, cookies/sessions, PostgreSQL, rate limiting, request context, telemetry, and WebSocket support.
- Fastify is also already aligned with the `liminal-build` reference, which reduces decision churn without forcing us to copy its weaker-fit choices.

## Database Recommendation

Recommend:

- Managed Postgres as the primary database

Strong researched default:

- Neon or equivalent managed Postgres

Why:

- The domain data is relational and operational: tenants, tokens, granted scopes, command definitions, chatter history keyed by `user_id`, recent clips, moderation and sync metadata.
- A normal relational database is the least surprising fit.
- Neon's official docs emphasize standard Postgres connectivity and pooled connections, which is useful if deployment topology grows or if background tasks increase connection churn.

Do not recommend as the primary backend data model:

- Convex

Why not:

- Convex is strong for reactive app flows, but the official docs still frame actions as serverless functions and explicitly encourage keeping action work small.
- This product already wants a separate long-running integration runtime for Twitch WebSockets and reconnect management.
- Once you need that always-on runtime anyway, using Convex as the core backend adds another major system without removing the hard part.

## Hosting Recommendation

Recommend:

- A long-running container/web-service host

Strong researched default:

- Render web service

Why:

- Render's docs explicitly state that web services can accept inbound WebSocket connections and can also initiate outbound WebSocket connections.
- That matches both sides of the app's live needs: the server can hold the Twitch EventSub connection and can also support browser live connections if we choose browser WebSockets.

Do not recommend as the default host:

- Vercel Functions for the core backend runtime

Why not:

- Current Vercel docs still describe a function model with duration limits and a shared file descriptor cap.
- Even with Fluid Compute, that model is not the cleanest fit for a backend whose core job is stable connection ownership and reconnect-sensitive event handling.

Important nuance:

- Vercel is not "impossible" here.
- It is just not the most efficient first choice for this specific product.

## Live Transport Recommendation

Recommend for Twitch -> server:

- Persistent EventSub WebSocket owned by the backend

Recommend for server -> browser:

- Start with SSE as the default design candidate
- Keep browser WebSockets as an acceptable alternative if architecture proves they simplify the live surfaces

Why this is the likely efficient default:

- The browser primarily needs ordered server push: live status, viewer count, chat, moderation side effects, and state updates.
- Mutating actions already fit ordinary HTTP.
- SSE reduces bidirectional protocol complexity while preserving reconnect-friendly server push.

Inference from the sources:

- Twitch's WebSocket requirements strongly constrain the server side.
- The browser transport is still an architecture choice, but SSE is worth treating as the simplest default rather than assuming browser WebSockets everywhere.

## Recommended Stack Decision

If we had to lock the stack today before architecture, I would choose:

- Monorepo: `pnpm`
- Language: TypeScript
- Client: React + Vite
- Server: Fastify on current Node LTS
- Validation/contracts: Zod
- Database: Postgres, hosted on Neon or equivalent managed Postgres
- Hosting: Render web service
- Realtime:
  - Twitch -> server: EventSub WebSocket
  - server -> browser: SSE first, with HTTP snapshot fallback
- Testing/tooling: Vitest + Biome

## What Should Still Be Decided In Architecture

The stack family is ready to lock. These decisions should stay open until architecture:

- ORM/query layer: Drizzle, Kysely, Prisma, or thin SQL
- Session model: secure cookie session vs server-backed session table
- Encryption strategy for stored Twitch tokens
- Whether browser live updates use SSE or WebSockets
- Whether a job queue is needed for retries, backfills, or clip follow-up polling
- Whether M2/M3 need Redis, or whether v1 can stay single-node plus Postgres
- Exact package boundaries inside the monorepo

## Final Answer

We have identified the right stack direction before architecture, but we should tighten it now:

- Keep the TypeScript monorepo direction.
- Keep Fastify and Vite.
- Move from plain TS DOM to React.
- Move from Convex-first thinking to Postgres-first thinking.
- Choose a long-running web-service host, with Render as the best researched default.
- Design around Twitch EventSub WebSockets as a first-class backend concern, not as an implementation detail.

That is enough certainty to proceed into architecture without premature lock-in at the ORM or transport-detail level.

## Sources

Local sources:

- `C:\github\streaming-control-panel\docs\prd.md`
- `C:\github\streaming-control-panel\braindump.md`
- `C:\github\liminal-build\package.json`

Official sources:

- Twitch EventSub WebSockets: <https://dev.twitch.tv/docs/eventsub/handling-websocket-events>
- Twitch EventSub subscription types: <https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/>
- Twitch chat send/receive: <https://dev.twitch.tv/docs/chat/send-receive-messages/>
- Twitch docs changelog: <https://dev.twitch.tv/docs/change-log/>
- Fastify homepage: <https://fastify.dev/>
- Fastify TypeScript docs: <https://fastify.dev/docs/latest/Reference/TypeScript/>
- Fastify ecosystem: <https://fastify.dev/docs/latest/Guides/Ecosystem/>
- React state docs: <https://react.dev/learn/managing-state>
- Vite "Why Vite": <https://vite.dev/guide/why.html>
- Convex actions: <https://docs.convex.dev/functions/actions>
- Convex HTTP actions: <https://docs.convex.dev/functions/http-actions>
- Convex limits: <https://docs.convex.dev/production/state/limits>
- Render WebSockets: <https://render.com/docs/websocket>
- Neon connection pooling: <https://neon.com/docs/connect/connection-pooling>
- Neon connect docs: <https://neon.com/docs/get-started/connect-neon>
- Vercel Functions limits: <https://vercel.com/docs/functions/limitations>
