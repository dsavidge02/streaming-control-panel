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

If `pnpm start` fails with `NODE_MODULE_VERSION` mismatch after switching Electron versions or rebuilding, run `pnpm rebuild` to re-invoke the postinstall and rebuild `better-sqlite3` against the current Electron ABI.

## Dev modes

| Command | Surface | Notes |
| --- | --- | --- |
| `pnpm --filter @panel/client dev` | Renderer-only browser view at `http://localhost:5173` | Story 5 landing renderer for UI iteration without Electron or Fastify |
| `pnpm --filter @panel/server dev` | Server-only Fastify mode | Placeholder for Story 7; lands in Story 7 |
| `pnpm start` | Full Electron app mode | Placeholder for Story 7; lands in Story 7 |
