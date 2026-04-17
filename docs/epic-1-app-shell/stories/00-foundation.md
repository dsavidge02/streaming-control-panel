# Story 0: Monorepo + Tooling Foundation

### Summary
<!-- Jira: Summary field -->

Establish the pnpm workspace, lint/typecheck/test tooling, shared error model, and verification scripts every later story inherits.

### Description
<!-- Jira: Description field -->

**User Profile:** Developer (secondary actor — this story delivers no streamer-visible behavior).

**Objective:** Stand up the pnpm monorepo with three workspace packages (`apps/panel/server`, `apps/panel/client`, `apps/panel/shared`), configure Biome + TypeScript + Vitest, and ship the typed error model + error-code registry in the shared package. Install the four-tier verification scripts (`red-verify`, `verify`, `green-verify`, `verify-all`) and the TDD guard (`guard:no-test-changes`). Seed the README.

**Scope — In:**
- pnpm 10 workspace with `pnpm-workspace.yaml` declaring `apps/panel/*`
- `apps/panel/shared/` package exporting `AppError` class, `ERROR_CODES` const map, `errorEnvelopeSchema` (Zod), route path constants (`PATHS`), and SSE event schemas
- `apps/panel/server/` and `apps/panel/client/` packages with `package.json`, `tsconfig.json`, and empty `src/` ready for later stories
- `biome.json` at repo root (Biome 2 lint + format)
- `tsconfig.base.json` at repo root; per-package `tsconfig.json` extends it
- Vitest installed and configured per package
- Root `package.json` scripts: `red-verify`, `verify`, `green-verify`, `verify-all`, `lint`, `lint:fix`, `format:check`, `format:fix`, `typecheck`, `test`, `test:e2e`, `guard:no-test-changes`
- `scripts/test-e2e-placeholder.mjs` — exits 0 with SKIP notice (replaced in Story 5)
- `scripts/guard-no-test-changes.mjs` — reads `.red-ref` file, diffs against it, fails if any `*.test.ts(x)` changed since the Red commit
- README seed: project title, one-paragraph description, prerequisites table (Node 24, pnpm 10, Twitch dev app redirect URI `http://localhost:7077/oauth/callback` — literal `http://` scheme; the `app://panel` scheme mentioned in Story 7 is an Electron-internal protocol for loading the bundled renderer and is NOT a Twitch redirect URI), `pnpm install` bootstrap

**Scope — Out:**
- Fastify server, Electron main process, renderer, SQLite, migrations — later stories
- Any route registration, preHandler, or cookie wiring
- CI workflow (Story 9)

**Dependencies:** None. Story 0 is the foundation every other story builds against.

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

**AC-8.3:** The error-code registry in the shared package includes at least: `AUTH_REQUIRED`, `ORIGIN_REJECTED`, `NOT_IMPLEMENTED`, `SERVER_ERROR`, `INPUT_INVALID`.

- **TC-8.3a: Registry contains starter set (unit)**
  - Given: The shared-package error registry export
  - When: A unit test reads the registered codes
  - Then: All five codes are present

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**Error-Code Registry (Epic 1 Starter Set):**

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTH_REQUIRED` | 401 | Request lacks an authenticated session |
| `ORIGIN_REJECTED` | 403 | Request's `Origin` header is not in the allowed set |
| `INPUT_INVALID` | 400 | Request body or parameters failed validation |
| `NOT_IMPLEMENTED` | 501 | Route registered; behavior pending a later epic |
| `SERVER_ERROR` | 500 | Unexpected unhandled server error |

Registry shape: typed `const` map exporting both the runtime codes and `ErrorCode` type (per tech design D12). `AppError` class carries `code`, `status`, `message`; `status` is derived from the registry. The registry is append-only by convention — later epics add codes; no epic changes an existing code's meaning.

**Error envelope:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `error.code` | string | yes | Matches a registered code |
| `error.message` | string | yes | Non-empty |

**Verification script composition:**

| Script | Composition |
|--------|-------------|
| `red-verify` | `format:check && lint && typecheck` |
| `verify` | `red-verify && test` |
| `green-verify` | `verify && guard:no-test-changes` |
| `verify-all` | `verify && test:e2e` |

`guard:no-test-changes` reads `.red-ref` (Red commit hash), diffs `*.test.ts(x)` since that ref, fails on any change. When `.red-ref` is absent, the guard skips — Story 4 is the first story with a TDD cycle and creates the file.

**Test file for this story:** `apps/panel/shared/src/errors/codes.test.ts` — 3 tests (TC-8.3a plus 2 non-TC: each registry entry has status + defaultMessage; `AppError` carries code + status + message).

See [`../tech-design.md`](../tech-design.md) §Workspace Layout and §Verification Scripts, and [`../tech-design-server.md`](../tech-design-server.md) §Error Model for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] `apps/panel/server`, `apps/panel/client`, `apps/panel/shared` packages created
- [ ] `@panel/shared` exports `AppError`, `ERROR_CODES`, `ErrorCode` type, `errorEnvelopeSchema`, `PATHS`, SSE schemas
- [ ] `@panel/shared` exports `GATE_EXEMPT_PATHS` as a frozen readonly array pre-populated with `[PATHS.auth.login, PATHS.oauth.callback]` — full Epic 1 contents. Story 1 consumes this in `registerRoute`'s safety check; Story 2 registers exempt routes against it; Story 4 asserts the contents via TC-2.3a and wires the session preHandler to read it
- [ ] Biome, TypeScript, Vitest configured in each package
- [ ] Root `package.json` scripts match the verification composition above
- [ ] `scripts/test-e2e-placeholder.mjs` exits 0 with SKIP notice
- [ ] `scripts/guard-no-test-changes.mjs` reads `.red-ref` and fails on test changes
- [ ] README seeded: title, description, prerequisites, `pnpm install`
- [ ] 3 tests pass in `shared/src/errors/codes.test.ts` (TC-8.3a + 2 supporting)
- [ ] `pnpm red-verify` passes
- [ ] `pnpm verify` passes
