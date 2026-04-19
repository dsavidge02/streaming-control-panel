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
| `pnpm --filter @panel/server dev` | Fastify standalone on `http://127.0.0.1:7077` | Server-side iteration without the Electron shell; writes `os.tmpdir()/panel-dev.sqlite` when Electron is not loaded, so delete it manually if these accumulate |
| `pnpm start` | Full Electron app - Fastify (`:7077`) + Vite renderer (`:5173`) + main process with HMR | Renderer source edits hot-reload without Electron restart |

## Continuous Integration

Every pull request against `main` runs `pnpm verify` (format, lint, typecheck, unit tests) on Ubuntu via [`.github/workflows/ci.yml`](.github/workflows/ci.yml). The workflow runs the same `pnpm` scripts you run locally, so any failure can be reproduced on your machine by running the same script the failing step printed.

The workflow does not run on push events to `main`, does not build packaged installers, does not run end-to-end Playwright tests, and does not run on a cross-OS matrix. Those are deferred to local pre-merge runs (`pnpm verify-all`, `pnpm verify-full`) and to the post-M3 release-engineering pass.

### Branch protection (maintainers)

CI is the pre-merge gate. Configure it once on GitHub:

1. Settings → Branches → Add branch protection rule for `main`
2. Enable "Require status checks to pass before merging"
3. Add `CI / verify` as a required check
4. Save

Once enabled, a PR cannot be merged until the `CI / verify` check is green on its head commit.

## Packaging

Epic 1 ships Windows-only packaging automation. `pnpm package` produces the Windows artifact in `dist/packaged/`, while macOS/Linux artifacts remain buildable via `electron-builder --mac` and `electron-builder --linux`. Smoke verification stays Windows-only until the post-M3 release-engineering epic.
Cross-OS installers and code signing are deferred until after M3.
