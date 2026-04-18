# Streaming Control Panel

Streaming Control Panel is a solo-Twitch-streamer desktop application for channel management, live moderation, clip creation, custom `!`-commands, and a welcome bot. It is installed and run locally on the streamer's machine.

| Prerequisite | Notes |
| --- | --- |
| Node.js 24 LTS | Matches Electron 41's bundled Node |
| pnpm 10.x | `corepack enable` is sufficient |
| Twitch developer application | OAuth redirect URI must be registered exactly as `http://localhost:7077/oauth/callback` (literal `http://`; Epic 2 blocks on this registration) |

## Bootstrap

```sh
pnpm install
```

## Troubleshooting

If a command fails with a `NODE_MODULE_VERSION` mismatch, rebuild `better-sqlite3` for the target runtime: `pnpm rebuild:electron` before `pnpm start`, `pnpm rebuild:node` before `pnpm test`. The two ABIs differ (Electron 41 = 145, Node 24 = 137), so switching between them requires an explicit rebuild each direction.

## Dev modes

| Command | Surface | Notes |
| --- | --- | --- |
| `pnpm --filter @panel/client dev` | Renderer-only browser view at `http://localhost:5173` | Story 5 landing renderer for UI iteration without Electron or Fastify |
| `pnpm --filter @panel/server dev` | Fastify standalone on `http://127.0.0.1:7077` | Server-side iteration without the Electron shell |
| `pnpm start` | Full Electron app - Fastify (`:7077`) + Vite renderer (`:5173`) + main process with HMR | Renderer source edits hot-reload without Electron restart |
