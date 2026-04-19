# Story 9: CI Workflow

### Summary
<!-- Jira: Summary field -->

Ship a GitHub Actions workflow that runs `pnpm verify` on Ubuntu for every pull request against `main`, and configure branch protection so failing CI blocks merge.

### Description
<!-- Jira: Description field -->

**User Profile:** Developer opens a pull request against `main`; CI runs lint, typecheck, and unit tests. Merging is blocked until CI passes.

**Objective:** Deliver the CI workflow. A single job runs on Ubuntu, checks out the repo, installs pnpm + Node 24, runs `pnpm install --frozen-lockfile`, then `pnpm verify` (lint + typecheck + test). No packaging, no cross-OS matrix, no release-publishing steps. The workflow runs on `pull_request` events against `main` only — push events to `main` do not trigger CI. Branch protection on `main` requires the `CI / verify` check before merge. CI commands are the same `pnpm` scripts developers run locally (AC-5.4).

**Scope — In:**
- `.github/workflows/ci.yml` — name `CI`, trigger `pull_request` against `main`, job `verify` on `ubuntu-24.04`
- Workflow steps: `actions/checkout@v4`, `pnpm/action-setup@v4` (version 10), `actions/setup-node@v4` (node-version 24, cache pnpm), `pnpm install --frozen-lockfile`, `pnpm verify`
- README CI section: how to interpret failing CI, branch protection setup instructions for maintainers
- `tools/ci/workflow.test.ts` — structural tests that assert the workflow YAML has no release-publish/packaging steps (TC-5.3a) and that every `run:` maps to a `pnpm` script defined in root `package.json` (TC-5.4a)
- Branch protection rule configured on `main`: "Require status checks to pass before merging" → required check `CI / verify`

**Scope — Out:**
- Cross-OS matrix (Windows, macOS runners) — post-M3
- `pnpm verify-all` in CI — Playwright is too slow/flaky for per-PR gating; runs locally before merge and post-package
- Release-publishing / automated versioning — post-M3
- Workflow on push events to `main` — deliberately excluded by AC-5.5
- Nightly / scheduled runs

**Dependencies:** Story 0 (verification scripts exist). Can run in parallel with Stories 1–8 after Story 0.

### Acceptance Criteria
<!-- Jira: Acceptance Criteria field -->

**AC-5.1:** A GitHub Actions workflow triggers on every `pull_request` event against `main` and runs on Ubuntu Linux. Workflow file path and runner image version are tech-design choices.

- **TC-5.1a: Workflow triggers on PR and runs on Ubuntu**
  - Given: A pull request is opened against `main`
  - When: GitHub receives the PR event
  - Then: A CI workflow begins running within GitHub Actions' normal queueing latency, on a Linux runner
  - *Verification:* Observed-run.

**AC-5.2:** The CI workflow runs lint (Biome), typecheck (TypeScript), and unit tests (Vitest).

- **TC-5.2a: Lint step runs**
  - Given: A PR with a lint violation in any workspace package
  - When: CI runs
  - Then: The lint step fails and the workflow is marked failed
  - *Verification:* Observed-run.
- **TC-5.2b: Typecheck step runs**
  - Given: A PR with a TypeScript error in any workspace package
  - When: CI runs
  - Then: The typecheck step fails and the workflow is marked failed
  - *Verification:* Observed-run.
- **TC-5.2c: Unit test step runs**
  - Given: A PR with a failing unit test
  - When: CI runs
  - Then: The unit test step fails and the workflow is marked failed
  - *Verification:* Observed-run.
- **TC-5.2d: Green PR produces green CI**
  - Given: A PR with no lint, typecheck, or unit-test violations
  - When: CI runs
  - Then: All three steps pass and the workflow is marked successful
  - *Verification:* Observed-run.

**AC-5.3:** CI does not build packaged installers, publish releases, or run on a cross-OS matrix. This is enforced by the workflow's declared `runs-on` and absence of release-publishing actions.

- **TC-5.3a: Workflow has no release-publish steps**
  - Given: A CI workflow run against a representative PR
  - When: The run completes
  - Then: No step executed a packaging command, no step invoked a release-publishing action, and the run executed on a single Linux runner
  - *Verification:* Assertable — `tools/ci/workflow.test.ts` parses `ci.yml` and asserts no step references `electron-builder`, `actions/create-release`, `softprops/action-gh-release`, or similar release actions; asserts `runs-on` is a single Linux value.

**AC-5.4:** The CI workflow runs the same `pnpm` scripts a developer runs locally.

- **TC-5.4a: CI commands match local scripts**
  - Given: A CI workflow run against a representative PR
  - When: The run completes
  - Then: Every command the workflow executed is a `pnpm` script defined in the repo
  - *Verification:* Assertable — `tools/ci/workflow.test.ts` parses `ci.yml` and asserts every `run:` starting with `pnpm ` matches a script name in root `package.json` (the `pnpm install` step is allowed as a package-manager primitive).

**AC-5.5:** CI is a pre-verification gate. A pull request cannot be merged to `main` until the CI workflow has completed successfully on the PR branch. The workflow does not run on push events to `main`.

- **TC-5.5a: Failing CI blocks merge**
  - Given: A PR with a failing CI run
  - When: A maintainer attempts to merge the PR
  - Then: The merge is blocked until CI passes
  - *Verification:* Observed-run. Depends on branch protection setup by a maintainer.
- **TC-5.5b: CI does not run on main push**
  - Given: A commit is pushed directly to `main`
  - When: GitHub receives the push event
  - Then: No CI workflow run is triggered by the push event
  - *Verification:* Observed-run.

### Technical Design
<!-- Jira: Technical Notes or sub-section of Description -->

**`.github/workflows/ci.yml` contract:**

| Aspect | Value |
|--------|-------|
| `name` | `CI` |
| `on` | `pull_request` with `branches: [main]` (no `push:` block) |
| `jobs.verify.runs-on` | `ubuntu-24.04` |
| Steps | `actions/checkout@v4`, `pnpm/action-setup@v4` (v10), `actions/setup-node@v4` (node 24, cache `pnpm`), `pnpm install --frozen-lockfile`, `pnpm verify` |

**Merge gate:**

| Mechanism | Where configured |
|-----------|------------------|
| Required status check: `CI / verify` | GitHub repo Settings → Branches → Branch protection rule for `main` |

Branch protection is configured outside the workflow file. README documents the setup steps for maintainers.

**Script-parity check (TC-5.4a):** the test parses `ci.yml`'s `steps[*].run` values, filters those starting with `pnpm ` (excluding `pnpm install`), extracts the script name, and asserts each one appears as a key in root `package.json` `.scripts`. This guards against CI drifting from local development over time.

**Packaging-absence check (TC-5.3a) — three narrow assertions:**

1. `runs-on` is a single value matching `/^ubuntu/` (no cross-OS matrix)
2. No step's `run:` value contains `electron-builder` or the exact token `pnpm package` (packaging absence)
3. No step's `uses:` value matches `actions/create-release`, `softprops/action-gh-release`, or `ncipollo/release-action` (release-publishing absence)

The substring list is deliberately narrow — banning generic tokens like `build` or `package` would produce false positives on harmless script names later. The check targets the specific actions and commands that would indicate release engineering in CI.

**Test file for this story:** `tools/ci/workflow.test.ts` — 2 tests (TC-5.3a, TC-5.4a). Lives at the workspace root because CI configuration is a root-level concern; picked up by a workspace entry or its own minimal `vitest.config.ts`.

**Observed-run TCs this story adds:** TC-5.1a, TC-5.2a–d, TC-5.5a, TC-5.5b.

See [`../tech-design-server.md`](../tech-design-server.md) §CI for full architecture, implementation targets, and test mapping.

### Definition of Done
<!-- Jira: Definition of Done or Acceptance Criteria footer -->

- [ ] `.github/workflows/ci.yml` exists with the contract above
- [ ] Workflow triggers on `pull_request` against `main`, not on push events to `main`
- [ ] Job runs on `ubuntu-24.04`
- [ ] Exactly one `run: pnpm verify` step (no split lint/typecheck/test steps — composition is in the script)
- [ ] No packaging or release-publishing steps/actions
- [ ] Branch protection rule on `main` requires `CI / verify`
- [ ] README CI section documents failing-CI interpretation and branch protection setup
- [ ] 2 tests pass in `tools/ci/workflow.test.ts`
- [ ] Observed-run checklist updated for TC-5.1a, TC-5.2a, TC-5.2b, TC-5.2c, TC-5.2d, TC-5.5a, TC-5.5b
- [ ] Representative PR run observed green; representative PR with a seeded violation observed red
- [ ] `pnpm verify` passes (the workflow test file is part of the test run)
