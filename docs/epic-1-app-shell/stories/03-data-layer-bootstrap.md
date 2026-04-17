# Story 3: Data Layer Bootstrap

### Summary
<!-- Jira: Summary field -->

Open a SQLite file at the OS userData path via `better-sqlite3`, run the Drizzle migration runner before the server accepts requests, and ship exactly one baseline migration creating `install_metadata`.

### Description
<!-- Jira: Description field -->

**User Profile:** Developer.

**Objective:** Land the Data Layer plumbing every later epic inherits — the SQLite file location, the native-module rebuild, the migration runner, and one install-identity table. No feature tables enter the schema in Epic 1. The relaunch sentinel uses SQLite's `PRAGMA user_version` rather than a test-only table (tech design D8 / I5 deviation).

**Scope — In:**
- `apps/panel/server/src/data/db.ts` — `openDatabase(filePath)` using `better-sqlite3`, sets `journal_mode=WAL` and `foreign_keys=ON`, returns a Drizzle instance; `applyMigrations(db)` runs Drizzle's migrator against `apps/panel/server/drizzle/`
- `apps/panel/server/src/data/schema/installMetadata.ts` — Drizzle table definition for `install_metadata` (`id`, `schema_version`, `created_at`, `app_version`)
- `apps/panel/server/drizzle/0001_install_metadata.sql` — baseline migration SQL: creates `install_metadata` with single-row CHECK constraint, inserts one row
- `resolveUserDataDbPath()` in `config.ts` — uses `app.getPath('userData')` when Electron is available (Story 7+); the `buildServer` call site threads `databasePath` through
- `electron-builder install-app-deps` wired as root `postinstall` — invokes `@electron/rebuild` 4.0.3 to rebuild `better-sqlite3` against Electron 41's Node ABI
- `buildServer` invokes `openDatabase` + `applyMigrations` before Fastify accepts requests (migrations run synchronously during startup)
- `apps/panel/server/src/test/tempSqlitePath.ts` — test helper creating a temp SQLite file with cleanup

**Scope — Out:**
- Feature tables (tokens, install binding, commands, chatters, welcome state, recent clips) — later epics
- Palette preference persistence column — deferred per tech design D9; Epic 1 uses renderer-side `localStorage` only
- Encryption on `install_metadata` — deferred per tech-design Open Question Q4 (no secrets in this table)

**Dependencies:** Story 1 (`buildServer` exists and now threads `databasePath` through to the open+migrate step).

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

**AC-9.1:** On first launch, a SQLite file is created at the OS's userData path under a known filename. On subsequent launches, the existing file is opened.

- **TC-9.1a: First launch creates file**
  - Given: No existing userData directory for this app
  - When: The full app boots
  - Then: A SQLite file exists at `<userData>/panel.sqlite`
- **TC-9.1b: Second launch reuses file (sentinel row)**
  - Given: The first launch has completed and the test writes a sentinel row into a test-only table created by the baseline migration
  - When: The app is stopped and relaunched
  - Then: The sentinel row is readable from the same SQLite file
  - *Implementation deviation (moved to Technical Design below):* tech design D8 / I5 substitutes `PRAGMA user_version` for the "test-only table" sentinel so the production schema is not polluted. TC intent preserved: first launch → write sentinel → close → reopen → sentinel still readable.

**AC-9.2:** The Drizzle migration runner is wired into server bootstrap and runs all unapplied migrations before the server begins accepting requests.

- **TC-9.2a: Migrations run before HTTP served**
  - Given: A fresh SQLite file
  - When: The server starts
  - Then: All baseline migrations are applied before the first HTTP request is served
- **TC-9.2b: Migrations are idempotent**
  - Given: A SQLite file with all migrations already applied
  - When: The server restarts
  - Then: The migration runner completes without error and without re-applying migrations

**AC-9.3:** `better-sqlite3` compiles cleanly against Electron's Node ABI on the developer's host OS. This validates arch A1 for that OS.

- **TC-9.3a: Native-module rebuild succeeds**
  - Given: A freshly-installed repo on the developer's host OS
  - When: The install step completes (including any `electron-rebuild` invocation)
  - Then: `pnpm start` opens the SQLite file without a native-module error
  - *Verification:* Observed-run. The test suite executing successfully on the developer's host OS is the concrete evidence. `pnpm start` end-to-end lives in Story 7; this story's contribution is the postinstall wiring that makes the rebuild happen. Documented in the README troubleshooting note added here.

**AC-9.4:** Exactly one baseline migration exists. No feature-specific tables (no tokens, no install binding, no commands, no chatters, no welcome state, no recent clips) exist in the Epic 1 schema.

- **TC-9.4a: Exactly one baseline migration applied**
  - Given: A fresh SQLite file after server bootstrap
  - When: The test reads the applied-migrations record
  - Then: Exactly one baseline migration is recorded
- **TC-9.4b: No feature tables present**
  - Given: The Epic 1 schema on disk
  - When: The test lists tables
  - Then: No table with a feature-specific name (`tokens`, `install_binding`, `commands`, `chatters`, `welcome_state`, `recent_clips`) exists

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**SQLite file location:**

| Environment | Path |
|-------------|------|
| Production / `pnpm start` | `<Electron app.getPath('userData')>/panel.sqlite` |
| Tests | `:memory:` (default in `buildTestServer`) or a `mkdtempSync` path (file-persistence tests) |

OS-specific userData paths (via Electron): Windows `%APPDATA%/<productName>`, macOS `~/Library/Application Support/<productName>`, Linux `~/.config/<productName>`.

**Baseline migration — `install_metadata`:**

| Column | Type | Constraint |
|--------|------|------------|
| `id` | INTEGER | PRIMARY KEY, `CHECK (id = 1)` — single-row table |
| `schema_version` | INTEGER | NOT NULL |
| `created_at` | INTEGER | NOT NULL (Unix ms) |
| `app_version` | TEXT | NOT NULL |

Baseline inserts one row: `(1, 1, unixepoch()*1000, '0.1.0')`.

**Relaunch sentinel (TC-9.1b) — deviation from epic TC text:** Epic's TC says "a sentinel row into a test-only table." Tech design D8 / I5 substitutes `PRAGMA user_version`: the test writes `PRAGMA user_version = <value>` after the first open, closes the DB, reopens the same file, reads `PRAGMA user_version`. SQLite persists `user_version` in the file header; no test-only table required. TC intent preserved; production schema stays clean. If the team wants the original wording preserved, update the source epic first and then republish.

**PRAGMAs set on open:** `journal_mode = WAL` — **tech-design choice (not an epic requirement)**; enables the read-while-writing pattern Epic 4a's live consumers will rely on. Cost-free to set now. `foreign_keys = ON` — standard safety.

**Native rebuild pipeline:**
```
pnpm install
  └── postinstall: electron-builder install-app-deps
      └── @electron/rebuild 4.0.3 → rebuild better-sqlite3 for Electron 41 ABI
```

README troubleshooting note added by this story: if `pnpm start` fails with `NODE_MODULE_VERSION mismatch`, remediation is `pnpm rebuild`.

**Test file for this story:** `server/src/data/db.test.ts` — 8 tests (TC-9.1a, TC-9.1b, TC-9.2a, TC-9.2b, TC-9.4a, TC-9.4b, plus 2 non-TC: install_metadata row count + default field values).

See [`../tech-design-server.md`](../tech-design-server.md) §Data Layer and §Baseline Migration for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] `openDatabase(filePath)` opens or creates the file, sets WAL + foreign keys PRAGMAs, returns Drizzle handle
- [ ] `applyMigrations(db)` runs Drizzle migrator against `apps/panel/server/drizzle/`
- [ ] Exactly one migration in `apps/panel/server/drizzle/` (`0001_install_metadata.sql`)
- [ ] `buildServer` wires `openDatabase` + `applyMigrations` before Fastify accepts requests
- [ ] Root `package.json` `postinstall` runs `electron-builder install-app-deps`
- [ ] `install_metadata` table has exactly one row after fresh migration; no feature tables present
- [ ] 8 tests pass in `server/src/data/db.test.ts`
- [ ] README gets troubleshooting note for `NODE_MODULE_VERSION` / `pnpm rebuild`
- [ ] `pnpm verify` passes
