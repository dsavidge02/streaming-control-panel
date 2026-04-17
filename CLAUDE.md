# streaming-control-panel — Claude Code guide

## What this repo is

An installed Electron desktop app that lets a solo Twitch streamer run their channel from one panel: channel management, live moderation, clip creation, custom `!commands`, and a welcome bot. Single-user, local-first, no hosted backend — Fastify server runs inside the Electron main process on `127.0.0.1:7077`. See `docs/prd.md` for product scope and `docs/architecture.md` for the technical world.

**Stack:** Electron 41, Node 24 LTS, Fastify 5, React 19 + Vite 8, Tailwind 4.1 + shadcn/ui, SQLite (better-sqlite3) + Drizzle 0.45, Zod 4, iron-session 8, Vitest 4, Biome 2, pnpm 10 workspace. No code is implemented yet — the repo is currently at Epic 1 Story 0 scaffolding.

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

Epic 1 Story 0 was attempted 2026-04-17 and rolled back due to a Windows Codex sandbox issue that silently disabled network access and caused `link:`-dependency corruption. The diagnosis, mitigation, and retry plan live in:

- `docs/epic-1-app-shell/RESTART-INSTRUCTIONS.md` — how to restart Story 0 in a fresh Claude Code session.
- `docs/epic-1-app-shell/team-impl-log.md` §Windows Codex Hardening — mandatory `--dangerously-bypass-approvals-and-sandbox` flag on every `codex exec`.

If you are a new Claude Code session opening this repo, read `RESTART-INSTRUCTIONS.md` before spawning any teammates.
