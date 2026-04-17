# Streaming Control Panel — Product Requirements Document

## Status

This PRD defines the product direction, feature scope, and epic sequencing for
the Streaming Control Panel (informal name: Twitch Admin Panel). Each feature
section is a compressed proto-epic: user scenarios, numbered rolled-up
acceptance criteria, and scope boundaries — structured for downstream
expansion into full epics with line-level ACs, TCs, and story breakdowns.

The companion Technical Architecture document will be produced separately by
`ls-arch`.

---

## Product Vision

A local desktop control panel that consolidates what a solo Twitch streamer
needs to run their channel and live stream into one place — channel
configuration, moderation, live chat, chat restrictions, clip creation,
custom `!commands`, and a welcome bot. The panel is packaged as an Electron
desktop app that each streamer installs and runs on their own machine. The
streamer signs in with Twitch (OAuth via a localhost callback) and the
installed instance is bound to their own broadcaster identity; the panel
acts on their behalf via the Twitch API.

v1 is streamer-only and local-only. The panel has no viewer-facing surface,
no public profile page, no overlay/alerts, no OBS/production control, and
no hosted/multi-tenant deployment. The longer-term direction is a one-stop
shop for streaming, which may eventually include production and overlay
surfaces and a hosted deployment — those are not v1 scope and are not
allowed to pull v1 into their orbit.

---

## User Profile

**Primary User:** A solo Twitch streamer who runs their own channel and
operates their own tools.
**Context:** They sit down to configure their stream between sessions, or
they are actively live and need to adjust, moderate, or capture something.
**Mental Model:** "I want to run my stream from one place. I want my bot to
do what I tell it, not what a template offers. I want to set it up once, not
fight the UI every time."
**Key Constraint:** Mid-stream attention is scarce. A streamer has seconds,
not minutes, to take an action before it costs them presence on stream.

---

## Problem Statement

A solo Twitch streamer today runs their stream across disconnected tools:
Twitch's own dashboard for channel settings, a third-party bot provider
(Nightbot, StreamElements) for `!commands` and welcome messages, an overlay
service for alerts, and OBS for production.

The pain ranked by the streamer:

1. **Setup cost.** Configuring commands or bot behavior requires leaving the
   stream context, navigating a provider's configuration UI, and expressing
   intent through a template that rarely fits.
2. **Third-party bots are rigid.** Commands and welcome messages from
   external bots are generic. What the streamer actually wants to say needs
   workarounds or isn't expressible.
3. **Too many tabs.** Routine tasks span Twitch + bot provider + overlays +
   OBS. There is no single surface for the work a streamer does around their
   stream.

The result: the streamer spends more effort managing their tooling than
running their channel.

---

## Product Principles

- **One surface, one purpose.** Everything a streamer needs for the scope
  the panel claims lives in the panel. No hopping to another tool for a
  covered action.
- **Custom over templated.** Commands and bot behaviors are defined by the
  streamer in the streamer's own words.
- **Fast mid-stream actions.** Live actions (mod, chat restrict, clip) fit
  in the attention budget of an active streamer.
- **Streamer-only.** No viewer-facing surface in v1. This is enforced at
  the route layer, not just by convention.
- **Local-first.** The panel runs on the streamer's own machine. Tokens,
  chatter history, commands, and all install state live in a local
  database on that machine. There is no hosted service in v1 and no
  cross-install surface to defend.
- **Platform-truthful scope.** The panel commits only to what the Twitch
  API actually supports. Gaps are documented as Out of Scope or Future
  Directions; the panel does not pretend to do what Twitch does not expose.

---

## Scope

### In Scope

A local desktop app (Electron-packaged for production installation;
`pnpm install && pnpm start` for development) that each streamer installs
on their own machine. One installed instance is bound to one Twitch
broadcaster identity. Core capabilities:

- Twitch OAuth sign-in via localhost callback; first sign-in binds the
  install to that broadcaster identity and persists across launches
- Channel configuration: stream title, category/game, tags, broadcaster
  language, content classification labels, branded content flag; read-only
  view of current goals, moderators, banned users, followers, and
  subscribers
- Live stream operations while live: auto-detected live state, viewer
  count, in-panel chat stream, mod actions (timeout / ban / delete message)
  anchored on chat messages, chat restriction toggles (slow / subs-only /
  followers-only / emote-only), create-a-clip-now
- Custom `!commands` — streamer-authored command/response pairs with
  role-tiered access and `{username}` placeholder substitution
- Welcome bot — first-time chatter detection (keyed on stable Twitch
  `user_id`) and configurable welcome message with persistent chatter
  history

### Out of Scope

- **Viewer-facing surfaces** — public profile, overlays, browser sources,
  alerts for viewers. Explicitly dropped from the prior repo's dual
  purpose. (Future direction.)
- **Channel About-page bio editing.** No clean Helix surface; defer.
- **Channel goal creation, editing, or ending.** Helix exposes Creator
  Goals as read-only. Streamer manages goal lifecycle in Twitch's own UI.
  (Future direction if Twitch adds write endpoints.)
- **Retroactive duration-based clipping** ("clip the last N minutes").
  Twitch's Create Clip endpoint captures ~30 seconds around the moment of
  the call; it does not accept an arbitrary past window. (Future
  direction; `Create Clip From VOD` is a possible path to revisit.)
- **Separate bot identity / hosted-chatbot pattern.** v1 bot messages
  post under the broadcaster's own identity. A distinct bot account is a
  v2 concern. (Future direction.)
- **Multi-channel per install** — team panels, a manager operating
  several streamers. (Future direction.)
- **Stream production control** — OBS scene switching, scene layout.
  (Future direction.)
- **Hosted / multi-tenant deployment** — v1 is a local desktop app each
  streamer runs on their own machine. A hosted multi-tenant product is a
  Future Direction; architecture must not preclude it, but v1 builds for
  local single-tenant only.
- **Multi-account per install.** The installed instance binds to one
  Twitch broadcaster identity. Running multiple broadcasters from a
  single install is not supported.
- **Timed / recurring bot messages** — announcements on a timer.
- **Commands that trigger non-chat actions** — overlay triggers, sound
  effects, API calls out.
- **Cross-tenant data sharing** — no shared command libraries, no chatter
  history import.

### Assumptions

| ID | Assumption | Status | Notes |
|----|------------|--------|-------|
| A1 | `channel.chat.message` EventSub (scope `user:read:chat`) is the primary integration path for reading chat, rather than legacy IRC | Unvalidated | Tech architecture (`ls-arch`) to settle. |
| A2 | Twitch EventSub + Helix together cover all live events the panel needs (stream start/end, chat, follows, subs, bans, goal progress, mod changes) without resorting to polling for primary data | Unvalidated | Affects F2 (scope set), F3 (live mod/ban/goal sync), F4a/b (live data), F5/F6 (chat send). Confirm coverage before F2 scope enumeration is finalized. |
| A3 | The broadcaster-authed token permits every moderation and channel-edit action the panel performs in v1 (mod list, ban list, chat settings, clip creation, chat send) given the correct scope set | Unvalidated | Scope set must be enumerated across all M1-M3 feature needs before F2 epic is finalized (cross-feature dependency). |
| A4 | On M3 launch every chatter is effectively "first-time" until they chat post-launch. No backfill or priming workflow is provided. Regulars, mods, and friends will get a one-time welcome the first time they chat after launch | Stated | Streamers may choose to disable the welcome bot until their regulars have passed through once. |
| A5 | Twitch OAuth accepts a localhost redirect URI (`http://localhost:<port>/oauth/callback`) registered on the Twitch developer app; the local server can reserve the required port for the callback | Unvalidated | Confirm port-binding and redirect-registration pattern during F2 epic design. |
| A6 | Electron is a viable packaging path for the production desktop app, and the local Node server runs cleanly inside the Electron main process alongside the renderer | Unvalidated | Confirm packaging and runtime topology during `ls-arch`. |

---

## Non-Functional Requirements

- **Live action responsiveness.** In-stream actions (mod, chat restriction
  toggle, clip) feel live to the streamer. The server accepts the action
  in under a second under normal load; user-visible completion is bounded
  by Twitch's own API latency plus render.
- **Chat render cadence.** Live chat in the panel stays as close to Twitch
  event-delivery reality as the underlying stream allows. Under bursty
  chat, message ordering is preserved and the panel does not fall
  permanently behind.
- **Live detection latency.** Stream start and end are detected and
  reflected in the UI within 15 seconds of the corresponding Twitch event.
- **Twitch rate-limit awareness.** All Helix interaction stays inside
  Twitch's published rate limits. Bulk reads (paginated follower/
  subscriber lists, chatter history) are paced. Rate-limit exhaustion is a
  handled condition, not an incident.
- **Session persistence.** Quitting and relaunching the app within session
  TTL preserves the authenticated session. Live data connections
  reconnect on transient network loss and resync current state (see
  EventSub handling below) so no truth is silently lost.
- **Token handling.** Twitch access and refresh tokens live in the local
  server process only (inside the Electron shell). The renderer process
  never sees raw tokens. Tokens are encrypted at rest against local-disk
  exposure.
- **Local data isolation.** Tokens, chatter history, commands, and all
  install state live in a local database on the streamer's own machine.
  There is no cross-install concern in v1 because each install holds at
  most one broadcaster's data.
- **Streamer-only routing.** Every route except the landing view and the
  OAuth callback requires an authenticated session. Unauthenticated
  access redirects to the landing view.

---

## Architecture Summary

Local desktop application packaged as Electron. Each installed instance is
bound to exactly one Twitch broadcaster. A local Node server process
(inside the Electron main process) owns Twitch API interaction, EventSub
subscriptions, encrypted token storage, and install-local persistent state
in a local SQLite database. The renderer process (React) renders a
streamer-facing UI and receives live updates during streams from the
local server via Server-Sent Events; mutations use ordinary HTTP.

The companion Technical Architecture at `docs/architecture.md` settles
the cross-cutting technical decisions — runtime, framework choices,
persistence layer, live transport, Electron packaging direction, and
Twitch integration strategy (hand-rolled; EventSub `channel.chat.message`
over legacy IRC). Epic tech designs inherit that world.

---

## Milestones

| Milestone | After | What the streamer gains | Feedback point |
|-----------|-------|-------------------------|----------------|
| M1 | F1, F2, F3 | Sign in with Twitch; one place to edit stream title, category, tags, language, content-classification toggles, and branded-content flag; see goals, mods, bans, followers, subs at a glance | Foundation milestone — the shell, OAuth, and the channel read/write surface. Does the shell boot reliably; do channel edits round-trip to Twitch; do reads stay within rate limits. Not expected to beat Twitch's dashboard on value yet. |
| M2 | F4a, F4b, F4c | Panel becomes a live-stream control surface: auto-detected live state, live viewer count, in-panel chat, message-anchored mod actions, chat restriction toggles, one-click create-a-clip-now | Real user-value milestone — does the panel hold up mid-stream as a mod and clip surface alongside OBS. |
| M3 | F5, F6 | Streamer-authored `!commands` with role-tiered access and `{username}` placeholder; welcome bot with persistent chatter history keyed on Twitch `user_id` | Directly tests the setup-cost and third-party-rigidity pain points. Does the panel replace Nightbot/StreamElements for this streamer. |

---

## Feature 1: App Shell & Landing

### Feature Overview

Establishes the runtime product surface that precedes authentication and
the cross-cutting infrastructure every later feature inherits: an Electron
desktop app that opens to a landing view describing the product with a
"Sign in with Twitch" action, route-level gating that keeps every other
surface behind an authenticated session, and the foundational platform
work (monorepo layout, Fastify server, React renderer, Data Layer wiring,
typed error envelope, localhost trust boundary, CI) that later features
build on without revisiting. Streamer-visible outcome is small — launch
the app, understand what this is, and sign in — but the feature owns the
whole substrate.

### Scope

#### In Scope

- Runnable app in two forms:
  - Production: an Electron-packaged desktop build (per-OS artifact) that a
    streamer downloads and runs. Installation is manual — the streamer
    obtains the build, runs it, and subsequent launches reopen it like any
    desktop application.
  - Development: `pnpm install && pnpm start` launches the local server +
    renderer for iteration.
- Landing view describing the product, with a single "Sign in with Twitch"
  action
- Route-level auth gating: every route except the landing view and the
  OAuth callback requires an authenticated session and redirects to the
  landing view when unauthenticated
- Monorepo scaffold, shared contracts package, and bootstrap commands that
  every later feature consumes
- Local Fastify server + React renderer wired for HTTP mutations and SSE
  live updates; stub endpoints for the OAuth callback and the live-events
  channel that later features fill in
- Localhost trust boundary: Origin-header validation on state-changing
  routes, server bound to loopback only
- Typed error envelope and append-only error-code registry consumed across
  every later feature
- Install-local persistence bootstrap: SQLite file at the OS userData
  path, migration runner, native-module build for Electron (feature tables
  land with their features)
- Continuous integration: pull-request workflow runs lint, typecheck, and
  unit tests

#### Out of Scope

- The Twitch OAuth flow itself (Feature 2)
- Any authenticated functionality (all downstream features)
- Auto-update / in-app update mechanism — v1 ships without self-update;
  new versions are obtained by downloading and running a new build.
  (Future direction.)
- Cross-platform signed installers, release pipeline, auto-update channel
  — deferred until all M1-M3 features ship; release engineering is a
  focused pass once the product surface stabilizes.

### Scenarios

#### Scenario 1: First Launch

A streamer launches the installed app without a prior sign-in. They see a
landing view that explains what the panel does and offers a single
sign-in entry point. Attempting any other route without a session sends
them back here.

**AC-1:** The landing view renders without authentication, describes the
product clearly enough for a streamer to decide whether to sign in, and
presents a single primary action to sign in with Twitch. Any route other
than the landing view and the OAuth callback requires an authenticated
session and redirects to the landing view when unauthenticated.

#### Scenario 2: Foundational Platform in Place

The first feature delivers the shared platform the rest of the product
sits on. By the end of Feature 1, later features do not redecide the
monorepo layout, the server-renderer transport, the error envelope, the
persistence bootstrap, or the CI policy.

**AC-2:** The repository is bootstrapped as a pnpm workspace. A local
Fastify server runs inside the Electron main process on a stable
loopback port. A shared contracts package is consumable from both the
server and the renderer. A SQLite database is created at the OS userData
path with a migration runner wired. An append-only error-code registry
and typed error envelope are in place. A pull-request CI workflow runs
lint, typecheck, and unit tests.

---

## Feature 2: Twitch OAuth & Tenant Onboarding

### Feature Overview

A streamer signs in with Twitch, authorizes the scope set the panel needs
across M1-M3, and the install binds to their broadcaster identity.
Subsequent launches restore the authenticated session. Access tokens
refresh automatically. Tokens never leave the local server process.

### Scope

#### In Scope

- Twitch OAuth authorization code flow with state/CSRF validation, using a
  localhost redirect URI (`http://localhost:<port>/oauth/callback`) bound
  by the local server
- Scope set covers every Twitch capability needed by all downstream
  features at grant time (enumerated across all M1-M3 needs before epic
  is finalized — cross-feature dependency, see A3)
- Install binding on first sign-in: the install becomes bound to that
  broadcaster identity. Subsequent sign-ins with the same broadcaster
  restore the session without duplicating state.
- Different-broadcaster sign-in is rejected. When an OAuth sign-in
  resolves a broadcaster different from the currently bound one, the
  panel refuses to rebind, discards the new tokens, and directs the
  streamer to the Reset app action.
- Reset app action: a deliberate, confirmation-guarded action reachable
  from an in-app settings surface. Wipes install-local state and returns
  the install to its pre-first-sign-in state, ready for a fresh binding.
- Authenticated session persists across app quit/relaunch within a TTL;
  sign-out ends the session and returns to the landing view
- Automatic access token refresh ahead of expiry
- Re-auth prompt when a refresh fails or the app grant is revoked

#### Out of Scope

- Non-Twitch auth (email/password, other providers)
- Multi-channel per install or team delegation (future direction)
- A separate bot identity distinct from the broadcaster (future direction;
  architecture must not preclude)
- Scope step-up flow for post-v1 feature additions

### Scenarios

#### Scenario 1: First Sign-In

A streamer clicks the sign-in action on the landing view, authorizes the
panel at Twitch, and returns to an authenticated home view with the
install now bound to their broadcaster identity.

**AC-1:** The OAuth flow completes successfully for a valid Twitch account
with state/CSRF validated on return. On success, the install binds to the
Twitch broadcaster ID and the streamer lands on the home view. If the
user denies the authorization at Twitch, the flow cancels cleanly with a
message explaining that the panel cannot function without the requested
scopes.

**AC-2:** The scope set requested at sign-in covers every Twitch
capability needed by all downstream features (F3, F4a, F4b, F4c, F5, F6).
Scope gaps surfaced post-v1 trigger an explicit re-auth prompt, not
silent failure.

#### Scenario 2: Returning to an Existing Install

A streamer who has already signed in previously launches the app. Their
session is still valid within TTL and they land on the home view, or the
session has expired and they re-sign-in with the same Twitch account and
reattach to the existing install state.

**AC-3:** The authenticated session survives app quit and relaunch within
the TTL. After TTL expiry, signing in again with the same broadcaster
restores the session and reattaches to the existing install state — it
does not duplicate data or reset install-local state. Install-local data
— channel config, commands, chatter history, bot state, encrypted tokens
— persists across launches, app restarts, and sign-outs.

#### Scenario 3: Signing in with a Different Broadcaster

A streamer already bound to one broadcaster attempts to sign in with a
different Twitch account on the same install. The panel refuses the
rebind and points them at the Reset app action as the deliberate path
to switch broadcasters.

**AC-4:** When an OAuth sign-in resolves a broadcaster identity that
differs from the currently bound broadcaster, the panel rejects the
sign-in without persisting the new tokens, returns to an unauthenticated
state, and shows a message that names the currently bound broadcaster
and directs the streamer to the Reset app action. No install-local data
is modified by the rejected sign-in.

**AC-5:** A Reset app action is available from an in-app settings
surface. Invoking it shows an explicit confirmation that names what will
be deleted — bound broadcaster identity, encrypted tokens, commands,
chatter history, welcome bot state, recent clips. On confirmation the
install-local state is wiped and the app returns to its pre-first-sign-
in state. A valid Twitch account (same or different broadcaster) can
then sign in as a fresh binding.

#### Scenario 4: Silent Token Refresh and Refresh Failure

The Twitch access token expires while the streamer is using the panel.
The server refreshes it transparently before any user-visible action
fails. A refresh failure ends the session with an explanatory re-auth
prompt.

**AC-6:** The server refreshes Twitch access tokens ahead of expiry
without user intervention. Actions in-flight during a refresh are not
observed as failures. A refresh failure is detected, the session is
terminated, and the streamer is prompted to re-sign-in with context on
what happened.

---

## Feature 3: Channel Management

### Feature Overview

The streamer edits channel configuration that Twitch exposes via
`PATCH /helix/channels` — stream title, category, tags, language, content
classification labels, branded content flag — and views read-only state
for goals, moderators, banned users, followers, and subscribers. Goals
and trust-surface state are reflected live via EventSub when the app is
open. This is the non-live surface; mid-stream actions are F4b.

### Scope

#### In Scope

- Edit channel properties supported by `PATCH /helix/channels`:
  - Stream title
  - Category / game
  - Tags (up to 10)
  - Broadcaster language
  - Content classification labels (mature, drugs, violence, etc. toggles)
  - Branded content flag
- View current channel goals (read-only; goal lifecycle is managed in
  Twitch's own UI per Out of Scope)
- View moderator list; add a moderator by Twitch username or user_id;
  remove a moderator
- View banned user list; unban from this surface
- View paginated follower list (read-only context)
- View paginated subscriber list (read-only context)
- Chatter/mod/banned-user identity is keyed on Twitch `user_id`;
  username and display name are presentation data that may change

#### Out of Scope

- Channel About-page bio editing (no clean Helix surface; see Future
  Directions)
- Goal create / edit / end (Helix is read-only for goals)
- Live viewer count, in-panel chat, or mid-stream mod actions (Features
  4a, 4b)
- Clip creation (Feature 4c)
- Custom `!commands` or bot behavior (Features 5, 6)
- Raid / host coordination
- Row actions on follower/subscriber lists beyond passive view

### Scenarios

#### Scenario 1: Editing Channel Properties Between Streams

A streamer updates stream title and category before going live, adjusts
tags and language, and toggles a content classification label or the
branded content flag as needed.

**AC-1:** The streamer edits any subset of stream title, category, tags,
broadcaster language, content classification labels, and branded content
flag. Valid changes persist via `PATCH /helix/channels` and are reflected
on the public channel. Tag count respects Twitch's 10-tag limit.
Validation rejects invalid values at the form layer before submission.
On save, the panel reflects the new values immediately.

#### Scenario 2: Viewing Current Goals

A streamer reviews their currently active channel goals.

**AC-2:** The streamer views a read-only list of their currently active
goals with type, target, and current progress. Live goal progress
(begin, progress updates, end) is reflected via EventSub (`channel.goal.*`
topics) when the panel is open. Goal management actions (create, edit,
end) are visibly absent from this surface with a pointer to Twitch's own
UI for managing the goal lifecycle.

#### Scenario 3: Managing Moderators and Banned Users

A streamer reviews their moderator list and unbans a user whose ban has
run its course.

**AC-3:** The streamer views the current moderator list and banned user
list. They add a moderator by Twitch username or user_id, remove a
moderator, and unban a user. These actions take effect on Twitch and
are reflected in the panel's state immediately.

**AC-4:** Moderator and banned-user state mirrors Twitch. Out-of-band
changes (via Twitch UI) are visible on next page load or explicit
refresh. Mod and banned-user records are keyed on `user_id`; a Twitch
account rename does not create a duplicate record or lose the
relationship. Live in-stream bans are F4b's concern.

#### Scenario 4: Follower and Subscriber Context

A streamer glances at their follower and subscriber lists for context
between streams.

**AC-5:** The streamer views paginated follower and subscriber lists.
Each row shows at least display name, follow- or subscribe-at timestamp,
and tier where applicable. Lists are read-only in this feature — no row
actions — and pagination is paced to stay within Twitch's rate limits.
Live follow/sub events are F4a's concern.

---

## Feature 4a: Live Detection & Monitoring

### Feature Overview

Detects stream start and end automatically, and while live renders current
viewer count and the chat stream in-panel. Mutating actions are out of
scope here — F4b and F4c consume the live substrate this feature
establishes.

### Scope

#### In Scope

- Automatic detection of live stream start and end via EventSub
  (`stream.online`, `stream.offline`)
- In-UI live/non-live state transitions without manual refresh
- Live viewer count while broadcasting
- Live chat stream rendered in the panel, keyed on `user_id` with display
  name shown as presentation
- Reconnection with state resync after transient network or subscription
  loss

#### Out of Scope

- Mutating mod actions (Feature 4b)
- Chat restriction toggles (Feature 4b)
- Clip creation (Feature 4c)
- Custom `!commands` (Feature 5)
- Welcome bot (Feature 6)

### Scenarios

#### Scenario 1: Going Live and Ending a Stream

The streamer starts broadcasting in OBS. The panel detects the live
state within seconds and switches to the live view. When the streamer
ends the broadcast, the panel returns to non-live.

**AC-1:** The panel detects live stream start within 15 seconds of the
Twitch `stream.online` event and transitions the UI to the live view.
Stream end is detected via `stream.offline` and the UI returns to non-
live. If the live connection drops during a stream, the panel
reconnects, re-establishes EventSub subscriptions, and REST-fetches
current state so the live view resyncs without the streamer refreshing.

#### Scenario 2: Monitoring the Live Stream

While live, the streamer watches current viewer count and the live chat
stream in the panel alongside OBS.

**AC-2:** Viewer count updates at a cadence that feels live to the
streamer. Chat messages from viewers appear in the panel as close to
Twitch event-delivery reality as the underlying stream allows, with send
order preserved. Under bursty chat the panel does not fall permanently
behind. Chatters displayed in chat are referenced internally by
`user_id`; the rendered display name reflects the latest known name.

---

## Feature 4b: Live Moderation & Chat Restrictions

### Feature Overview

Turns the live view into a mod surface. The streamer takes message-
anchored moderation actions (timeout, ban, delete message) directly on
chat entries and toggles chat restrictions (slow, subs-only, followers-
only, emote-only) from a single control. Unban lives on F3's banned-list
surface, not here — unbanned users are not present in live chat to anchor
an action on.

### Scope

#### In Scope

- Message-anchored moderation actions in the live chat view: timeout,
  ban, delete message
- Chat restriction toggles: slow mode, subscribers-only, followers-only,
  emote-only
- Current chat restriction state always visible in the live view
- All actions are keyed on `user_id` internally and mirror back to
  Twitch state

#### Out of Scope

- Unban (lives in F3's banned-list surface)
- Clip creation (Feature 4c)
- Live detection and chat rendering (Feature 4a — prerequisite)
- Raid / host initiation

### Scenarios

#### Scenario 1: Moderating Mid-Stream

A viewer disrupts chat. The streamer takes action from the panel within
seconds.

**AC-1:** Anchored on a chat message in the live view, the streamer can
timeout, ban, or delete the message with minimal clicks per action.
Actions take effect on Twitch and are reflected in the panel's state.
Destructive actions with high misclick cost use a single confirmation;
routine actions do not.

#### Scenario 2: Adjusting Chat Restrictions

Chat is getting rowdy. The streamer toggles slow mode, or locks chat to
subscribers while they regroup.

**AC-2:** The streamer toggles slow mode, subscribers-only, followers-
only, and emote-only from a single control surface. Current restriction
state is always visible. Toggling reflects immediately in the panel and
in Twitch chat.

---

## Feature 4c: Clip Creation

### Feature Overview

Lets the streamer create a clip in one action while live. v1 uses
Twitch's native Create Clip behavior — approximately the last 30 seconds
of the current broadcast, as a draft the streamer can finalize later.
Retroactive duration-based clipping is explicitly out of scope (Future
Direction).

### Scope

#### In Scope

- One-click clip creation while live via `POST /helix/clips`
- Response surfaces clip URL and edit URL; the clip is added to a
  recent-clips list local to the install
- Visible indication when a clip has been created and where to finalize
  it

#### Out of Scope

- Retroactive duration-based clipping ("clip the last N minutes") —
  Twitch's Create Clip does not support arbitrary past windows. `Create
  Clip From VOD` is a possible future path.
- Editing clip metadata (title, thumbnail) in the panel — that happens
  in Twitch's own clip editor via the returned edit URL
- Clip management beyond a recent-clips list

### Scenarios

#### Scenario 1: Capturing a Moment

Something memorable just happened. The streamer clicks the clip button
and goes back to streaming.

**AC-1:** While live, the streamer creates a clip with one action. The
panel returns the clip URL and edit URL within a few seconds of Twitch
processing. The new clip appears in a recent-clips list local to the
install. Clip creation outside of live is unavailable and labeled as a
live-only action.

---

## Feature 5: Custom Chat Commands

### Feature Overview

The streamer defines their own `!command → response` pairs in the panel.
When a viewer types a recognized command during a live stream, the bot
posts the configured response in chat under the broadcaster's identity
(per the v1 bot model). Commands are role-tiered and support a
`{username}` placeholder for personalization.

### Scope

#### In Scope

- Create, edit, disable, delete `!command` entries from the panel
- Command response is text; a `{username}` placeholder substitutes the
  display name of the triggering user
- Role tiers restrict who can trigger a command. The v1 starting set is
  MOD / VIP / GENERAL; the role taxonomy is open to expansion in later
  versions
- Bot responds to recognized commands in chat during live streams,
  posting under the broadcaster's identity
- Commands persist across launches in install-local storage

#### Out of Scope

- Scripted or multi-step commands
- Commands that trigger non-chat actions (overlays, sounds, API calls)
- Templating beyond `{username}` (e.g., stream duration, last follower)
- Timed or recurring announcements (future direction)
- Shared command libraries across tenants
- Bot messages under a distinct bot identity (v2 future direction;
  v1 posts under the broadcaster's name)

### Scenarios

#### Scenario 1: Creating a Command

A streamer sets up `!discord` that posts their Discord invite in chat.

**AC-1:** The streamer creates a command by supplying a command name
and response text, and selecting a role tier. The command name is
normalized (leading `!` optional). Duplicate command names within the
install are prevented on save. On save the command becomes active
without requiring a stream restart.

#### Scenario 2: A Viewer Triggers a Command

A viewer types `!discord` during a live stream. The bot posts the
configured response in chat.

**AC-2:** Recognized commands in chat trigger the configured response,
posted to chat under the broadcaster's identity. Unrecognized commands
(e.g. `!unknownthing`) are silently ignored. Commands are guaranteed to
work during a live stream; behavior outside of live is not guaranteed
in v1.

**AC-3:** Responses support a `{username}` placeholder that is
substituted with the display name of the triggering user. Unknown
placeholders (anything other than `{username}` in v1) render literally
so the streamer sees what they wrote.

**AC-4:** Role tiers restrict who can trigger a command. MOD commands
only fire for users Twitch identifies as mods; VIP commands fire for
VIPs and mods; GENERAL commands fire for anyone. Role evaluation keys
on `user_id` / role flags in the chat event and does not noticeably
add to response latency.

#### Scenario 3: Managing Commands Over Time

A streamer reviews their commands and adjusts them as their channel
evolves.

**AC-5:** The streamer views all commands, edits response text or role
tier, temporarily disables a command so it stays in the list but does
not trigger, and deletes a command permanently. All changes take effect
immediately; no stream restart required.

---

## Feature 6: Welcome Bot & Chatter Tracking

### Feature Overview

The panel tracks every viewer who has chatted in the streamer's channel —
keyed on stable Twitch `user_id`, not username — and welcomes first-time
chatters with a configurable message. Chatter history persists across
streams, app restarts, and sign-outs in install-local storage.

### Scope

#### In Scope

- Persistent install-local list of every chatter who has chatted in the
  channel, keyed on Twitch `user_id`
- First-time chatter detection — first message from a `user_id` not
  previously seen by this install triggers the welcome
- Configurable welcome message with `{username}` placeholder
- Welcome bot enable/disable toggle
- Streamer-visible chatter history: display name (latest known),
  `user_id`, first-seen, last-seen, approximate message count
- Cold-start behavior per A4: on launch every chatter is effectively
  first-time until they chat post-launch

#### Out of Scope

- Automated chatter scoring, shadowbanning, or auto-moderation beyond
  F4b's mod actions
- Per-chatter notes or tags
- Welcome actions other than a chat message (overlay, sound, alert)
- Backfill of historical chatter data from pre-v1 streams
- Tracking chatters by username (identity is `user_id` — username
  changes do not create duplicate records)
- Search over chatter history (future direction)

### Scenarios

#### Scenario 1: Welcoming a First-Time Chatter

A viewer sends their first-ever message in the channel. The bot posts
the welcome message.

**AC-1:** On the first message from a `user_id` the install has never
seen, the bot posts the configured welcome message to chat. The
`user_id` is recorded at the same moment so subsequent messages from
that user do not trigger a second welcome. The welcome is posted within
a soft-live target — about a second from the triggering message under
normal conditions, bounded by Twitch chat send latency.

**AC-2:** The welcome message is configurable by the streamer and
supports a `{username}` placeholder substituted with the triggering
user's display name. The welcome bot can be disabled entirely; when
disabled, chatters are still tracked but no welcome is posted. Welcome
messages post under the broadcaster's identity (v1 bot model).

#### Scenario 2: Reviewing Chatter History

A streamer looks back at who has chatted in their channel over time.

**AC-3:** The streamer views their chatter history: display name
(latest known), `user_id`, first-seen timestamp, last-seen timestamp,
and approximate message count. Long histories are paginated; search
over chatter history is a future direction. A chatter who renames on
Twitch does not appear twice; their record updates the display name.

#### Scenario 3: Persistence Across Streams and Sessions

A streamer ends a stream, signs out, and returns weeks later.

**AC-4:** Chatter state persists across stream sessions, app restarts,
and sign-outs in install-local storage. A chatter recorded during an
earlier stream does not trigger a welcome in a later stream.

---

## Cross-Cutting Decisions

- **Streamer-only UX, enforced at the route layer.** Every route except
  the landing view and the OAuth callback requires an authenticated
  session. Enforced centrally, not by per-route convention.

- **Bot posting identity (v1).** All bot-authored chat messages (`!command`
  responses, welcome messages) post under the broadcaster's own identity
  via `POST /helix/chat/messages` or equivalent. The streamer sees their
  own username on bot messages. A distinct bot identity is a Future
  Direction, not v1.

- **Identity is `user_id`.** Every reference to a Twitch viewer — chatters,
  moderators, banned users, command triggerers, welcome targets — uses
  the stable `user_id` as the canonical key. Usernames, logins, and
  display names are presentation data that may change without warning.
  Account renames do not create duplicate records or lose historical
  association.

- **Single-tenant per install.** Each installed instance is bound to
  exactly one Twitch broadcaster identity, established on first sign-in.
  Architecture should not preclude a future hosted multi-tenant variant
  (see Future Directions), but v1 does not build for it.

- **Live-connection visibility.** The streamer can always see when the
  live connection to Twitch is healthy, reconnecting, or broken. Silent
  failure into stale state is a bug, not a feature. (Reconnect mechanics
  — per-install session, subscription right-sizing, REST state recovery,
  `message_id` deduplication — are settled in the Technical Architecture
  doc.)

- **Rate-limit awareness.** All Helix interaction stays inside Twitch's
  published rate limits. Bulk operations (pagination through followers,
  subscribers, chatter history) are paced. Exhaustion is handled, not
  incidental.

- **Platform-truthful scope.** If Twitch does not expose a capability, the
  panel does not pretend to. Goals write, retroactive clipping, and
  About-page bio editing are documented as Out of Scope with their
  platform reasons; the streamer is pointed to Twitch's native surface
  where one exists.

- **Confirmation economy.** Mid-stream actions avoid modal confirmation
  except where misclick cost is genuinely high (ban, permanent delete).
  Confirmation is a resource to spend sparingly, not a default.

- **Out-of-scope guardrail.** Features that drift toward viewer-facing
  functionality, OBS/production control, hosted multi-tenant deployment,
  or multi-account-per-install are rejected at the PRD level. Epics do
  not re-open these boundaries.

---

## Future Directions

Not v1 scope. Listed so architecture decisions leave room without
building for them.

- **Hosted / multi-tenant deployment.** Running the panel as a hosted web
  service where each streamer is a tenant rather than running their own
  local install. Would require tenant isolation at the data layer, cloud
  persistence, shared deploy infrastructure, and a non-localhost OAuth
  redirect. Architecture should not preclude this path.
- **Separate bot identity (v2).** A bot account distinct from the
  broadcaster, posting chat messages under a bot name/badge. Architecture
  must not preclude this.
- **Retroactive clipping.** Duration-selectable clips of the last N
  minutes. `Create Clip From VOD` is a candidate path to revisit.
- **Channel About-page bio editing.** No clean Helix surface today;
  defer until Twitch exposes one.
- **Goal lifecycle management.** Create / edit / end goals from the
  panel when Twitch exposes a write API.
- **OBS and production control.** Scene switching, browser sources,
  alert overlays. Part of the long-term "one stop shop for streaming."
- **Viewer-facing surface.** Public profile, on-stream overlays, or
  alerts graphics fed by panel state.
- **Auto-update / in-app update mechanism.** v1 ships without self-update;
  new versions require downloading and running a new build.
- **Team / manager panels.** A single panel operating multiple
  broadcaster identities with delegated permissions.
- **Timed / recurring bot messages.** Scheduled announcements in chat.
- **Command templating beyond `{username}`.** Stream duration, last
  follower, uptime, etc.
- **Chatter-history search.** Query and filter the chatter list beyond
  pagination.
- **Command library sharing.** Import/export command sets across
  tenants.

---

## Recommended Epic Sequencing

```
Epic 1: App Shell (M1)
    │
    └──→ Epic 2: Twitch OAuth & Tenant (M1)
              │
              └──→ Epic 3: Channel Management (M1)
                        │
                        └──→ Epic 4a: Live Detection & Monitoring (M2)
                                  │
                                  ├──→ Epic 4b: Live Moderation (M2)
                                  │
                                  └──→ Epic 4c: Clip Creation (M2)
                                            │
                                            └──→ Epic 5: Custom !commands (M3)
                                                      │
                                                      └──→ Epic 6: Welcome Bot (M3)
```

**Rationale:**
- Epics 1 → 2 → 3 are a linear M1 spine. No feature sits in front of
  OAuth, and OAuth's scope correctness is first tested by Epic 3's
  channel edits.
- Epic 4a establishes the live-data substrate (live detection, chat
  render, EventSub handling). Epics 4b and 4c consume that substrate.
  4b and 4c can run in parallel once 4a is stable; they touch different
  Twitch endpoints and different UI surfaces.
- Epics 5 and 6 depend on chat send/receive plumbing from 4a/4b and on
  `user_id` identity conventions. They share plumbing but different
  triggers and data models, so they can parallelize once those are in
  place.

---

## Relationship to Downstream Specs

This PRD is the upstream input for detailed epic specs. Each feature
section maps to one epic. The PRD defines *what* and *why*. The epics
(produced by `ls-epic`) define *exactly what*, with line-level ACs, test
conditions, data contracts, and story breakdown traceable back to these
rolled-up ACs. The tech designs (produced by `ls-tech-design`) define
*how*. A Technical Architecture document (produced by `ls-arch`) settles
the cross-cutting technical decisions flagged in the Architecture
Summary before any feature epic enters tech design.

---

## Validation Checklist

- [x] User Profile grounds every feature — each feature traces to the
      solo streamer's configuration, live-stream, or bot-setup needs
- [x] Problem Statement justifies the product — ranked pain points
      (setup cost, third-party rigidity, too many tabs) drive feature
      selection
- [x] Each feature has Feature Overview, Scope, and Scenarios with
      numbered ACs
- [x] Scenarios describe user situations with enough detail to
      decompose into epic flows
- [x] Rolled-up ACs are decomposable without the epic writer inventing
      behavior
- [x] Every AC keyed on a Twitch capability has been checked against
      what the platform actually exposes; gaps are documented as Out
      of Scope or Future Directions
- [x] No line-level ACs, TCs, or data contracts
- [x] Out-of-scope items point to where they're handled (another
      feature, future direction, or platform constraint)
- [x] Milestones define feedback-gated phases with honest value claims
- [x] NFRs surfaced, including rate-limit and live-connection concerns
- [x] Architecture summary points at the companion Technical
      Architecture (`docs/architecture.md`) without re-deciding its
      content
- [x] Cross-cutting decisions documented at product altitude; technical
      cross-cutting (EventSub mechanics, token encryption, transport
      choice) lives in the Technical Architecture
- [x] Terminology normalized: `install` and `broadcaster` describe the
      local single-install model; `tenant` reserved for Future
      Direction hosted-variant language
- [x] Epic sequencing has rationale
