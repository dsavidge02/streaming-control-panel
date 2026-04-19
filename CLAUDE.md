# streaming-control-panel — Claude Code guide

## What this repo is

An installed Electron desktop app that lets a solo Twitch streamer run their channel from one panel: channel management, live moderation, clip creation, custom `!commands`, and a welcome bot. Single-user, local-first, no hosted backend — Fastify server runs inside the Electron main process on `127.0.0.1:7077`. See `docs/prd.md` for product scope and `docs/architecture.md` for the technical world.

**Stack:** Electron 41, Node 24 LTS, Fastify 5, React 19 + Vite 8, Tailwind 4.1 + shadcn/ui, SQLite (better-sqlite3) + Drizzle 0.45, Zod 4, iron-session 8, Vitest 4, Biome 2, pnpm 10 workspace. Epic 1 is complete — the app shell, server gate, data layer, renderer, router, Electron shell, packaged artifact, and CI workflow are implemented and merged on `main`.

**pnpm linker:** Root `.npmrc` must set `node-linker=hoisted`. The default symlinked `.pnpm/` store breaks electron-builder's traversal and `@electron/rebuild`'s write-back path; hoisted produces an npm-flat `node_modules/` that packaging tooling understands natively. See `docs/epic-1-app-shell/stories/decisions-log.md` Decision #1.

## How to read the documentation

This project is specified using the **Liminal Spec** methodology. Documents layer from general to specific; always read top-down when onboarding.

```
docs/
├── prd.md                        -- product requirements (9 features)
├── architecture.md               -- technical architecture (7 top-tier surfaces)
├── references/                   -- visual + prior-art references
├── research/                     -- ad-hoc investigations (e.g., tooling, upstream feedback)
├── reviews/                      -- review artifacts (epic reviews, etc.)
├── v2-findings/                  -- ongoing notes on the v2 skills experiment (see below)
└── epic-N-<slug>/                -- one directory per epic
    ├── epic.md                   -- the epic spec (ACs, TCs, scope)
    ├── tech-design.md            -- index + cross-cutting decisions
    ├── tech-design-server.md     -- server/Electron/Fastify/SQLite depth
    ├── tech-design-client.md     -- React/Vite/renderer depth
    ├── test-plan.md              -- TC→test mapping, mock strategy, counts
    ├── ui-spec.md                -- (v2) visual system, screens, states, verification surface
    ├── stories/
    │   ├── NN-<slug>.md          -- one story per file, sharded by BA
    │   └── coverage.md           -- AC/TC coverage gate, integration path traces
    └── team-impl-log.md          -- per-epic orchestration log (state, hardening, handoff templates)
```

**Reading order for a new story implementation:** `tech-design.md` → relevant companion (`tech-design-server.md` or `tech-design-client.md`) → `test-plan.md` → `epic.md` → the specific story → `coverage.md` to confirm AC ownership. The UI spec enters scope at Story 5 of Epic 1.

## Liminal Spec skills in use

- **Planning:** `ls-prd`, `ls-arch`, `ls-epic`, `ls-tech-design-v2` (experimental), `ls-publish-epic`.
- **Implementation:** `ls-team-impl-v2` (experimental) orchestrates per-story implementation via Codex CLI subagents (gpt-5.4) plus agent-team coordination (implementer + reviewer teammates per story).

We are deliberately running the **v2** variants, which add a UI spec companion (`ui-spec.md`) produced by the tech design and consumed during implementation. v2 is experimental; findings are captured for upstream skill refinement.

## Note-taking + v2 experiment

We are actively testing the v2 skills and recording observations for refinement. Three places collect notes:

1. **`docs/v2-findings/`** — accumulating findings doc (one file per finding). Start with `README.md` for the index. Distinguishes v2-specific issues from cross-skill-family issues so feedback to upstream is correctly attributed.
2. **`docs/epic-N-*/team-impl-log.md`** — the per-epic orchestration log. First-class deliverable alongside the code. Carries run state, CLI selection, verification gates, boundary inventory, materialized handoff templates, and narrative Process Notes as issues surface.
3. **`docs/research/`** — upstream-directed reports when a finding warrants sharing back to skill maintainers (e.g., `ls-team-impl-windows-codex-findings.md`).

User-scoped preferences and feedback memories live outside the repo at `~/.claude/projects/C--github-streaming-control-panel/memory/`.

## Current state — before starting work

Epic 1 is complete. Stories 0-9 were accepted and merged to `main` via PR #1 at `6df71f8` on 2026-04-18. Cumulative tests are 78 Vitest (4 shared + 3 tools/ci + 39 server + 32 client), 17 Playwright baselines, and 1 `pnpm smoke:packaged` boot gate. Epic 2 (Twitch OAuth & Tenant Onboarding) is next and has not started yet. See `docs/epic-1-app-shell/team-impl-log.md` for the orchestration log and `docs/epic-1-app-shell/stories/coverage.md` for the AC/TC ownership map + cross-story dependency chain.

## Codex harness

Running Codex on this project has a single canonical procedure. Follow it and Codex completes reliably without manual intervention; deviate and you reintroduce the Story 0 / Story 1 failure modes (Windows sandbox bypass, `/tmp/` path divergence, session-wide flake walls, turn-budget exhaustion mid-fix).

- **Runbook:** `docs/codex-harness.md` — the definitive procedure. Read this first if you touch Codex.
- **Scripts:** `scripts/codex/` — the harness itself (exec wrapper, completion checker, outer driver, prompt composer, env-rules block).
- **Supporting findings:** `docs/v2-findings/001, 004, 005, 006, 007, 009` — historical evidence that feeds the runbook.

For teammates spawned by the `ls-team-impl-v2` orchestration, the canonical handoff flow is: read artifacts → author a task section → `scripts/codex/compose-prompt.sh` → `scripts/codex/drive-until-green.sh` → relay the auto-generated `<stem>.impl-report.md` verbatim via SendMessage. See `docs/codex-harness.md` §Teammate usage for the exact commands and exit-code handling.
