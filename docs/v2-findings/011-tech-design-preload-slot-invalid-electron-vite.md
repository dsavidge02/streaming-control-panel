# Finding 011 — Tech-design §Packaging preload slot shape fails electron-vite 5 validation

**Date:** 2026-04-18
**Story:** Epic 1 / Story 7 (Electron main + `pnpm start`)
**v2-specific?** Partially — the shape lives in `tech-design-server.md` (produced by `ls-tech-design-v2`), but the root cause is a generic spec-accuracy issue, not something unique to the UI spec companion.
**Status:** Fix in-flight. Recommend editing tech-design §Packaging in place once the project decides on the preferred mechanical remedy.

---

> **Update 2026-04-18 (second occurrence):** the same class of defect hit the **renderer** slot right after the preload fix landed. The `renderer` block in §Packaging also omits `build.rollupOptions.input`, and electron-vite 5 rejects it with:
> ```
> index.html file is not found in /src/renderer directory.
> error during start dev server and electron app:
> Error: build.rollupOptions.input option is required in the electron vite renderer config.
> ```
> Root cause and recommendation below apply to **both** slots — the tech-design §Packaging snippet needs explicit `rollupOptions.input` for every configured section, not just preload.
>
> **Update 2026-04-18 (third occurrence):** after the renderer fix landed, `pnpm start` advanced further — main + preload + renderer dev server all built and started — then failed at the Electron entry-file check:
> ```
> error during start dev server and electron app:
> Error: No entry point found for electron app, please add a "main" field to package.json
>   at ensureElectronEntryFile (…electron-vite…)
> ```
> This is the SAME category of §Packaging-incomplete-for-electron-vite-5 defect, just on a different surface: the root `package.json` needs a `"main": "dist/main/index.js"` top-level field so electron-vite can locate the built main-process bundle. The tech-design §Packaging section documents the `electron-builder.yml` + `electron.vite.config.ts` shapes but does NOT say that the root `package.json` needs a `"main"` field. The implementer and dual reviewers both missed it because the spec didn't call it out; `pnpm verify` doesn't exercise `pnpm start`, so the gate stays green with the field absent.
>
> **Tally:** three distinct spec-shape defects in `tech-design-server.md` §Packaging caught by the same observed-run gate in a single story cycle — preload `rollupOptions.input`, renderer `rollupOptions.input`, and root `package.json#main`. All three structurally invisible to dual review + `pnpm verify`. This strengthens the recommendation below: the tech-design skill family needs a "run the prescribed tool once against the prescribed config and check it starts" step during spec verification — or the electron-vite section specifically needs a complete, runnable reference config including the `package.json#main` requirement. Each individual miss looked minor; the cumulative effect was a multi-round fix cycle with human-in-the-loop on every iteration.

## Summary

Tech-design-server.md §Packaging prescribes this electron-vite 5 config for the preload slot:

```ts
preload: {
  // Epic 1 ships no preload script; keep the slot so later epics can add IPC if truly necessary.
  plugins: [externalizeDepsPlugin()],
  build: { outDir: 'dist/preload' },
},
```

The *intent* is "reserve the slot, ship no preload content in Epic 1." The *mechanics* fail: electron-vite 5 rejects a configured section with no `build.lib.entry` or `build.rollupOptions.input`, so `pnpm start` fails immediately during renderer/preload dev-server construction:

```
ERROR  An entry point is required in the electron vite preload config,
which can be specified using "build.lib.entry" or "build.rollupOptions.input".
```

Story 7 was implemented to match the spec literally, passed dual review + gate, and still could not boot. The observed-run TC (human `pnpm start`) is what caught it.

## What happened

1. Implementer teammate read `tech-design-server.md` §Packaging, copied the config shape verbatim into `electron.vite.config.ts`.
2. Dual review (Codex spec-compliance + Opus architectural) treated the config as spec-compliant, because it *was* — faithful to the document.
3. Gate `pnpm red-verify && pnpm verify` passed (neither Biome nor TypeScript nor Vitest exercises electron-vite's dev-server config validator).
4. Team-lead surfaced the observed-run gate to the user. First invocation of `pnpm start` failed with the error above.

## Impact

- Story 7 rolled into a fix round after a clean review pass. Story-level cycle time +1 extra harness iteration.
- Validates the "observed-run is a distinct gate beyond structural review" pattern (companion to Finding 010 — visual-behavior defects that structural review misses). For Story 7, structural review could not have caught this without actually running electron-vite.
- **Does NOT indicate dual review failed.** Codex + Opus both reviewed faithfully against the spec. The spec itself carried the defect. This is a spec-accuracy finding, not a review-depth finding.

## v2 attribution

Tech-design-server.md is the product of `ls-tech-design-v2`. The §Packaging section was written based on electron-vite documentation at authoring time; the failure mode is a shape-versus-runtime mismatch that only manifests when the dev server actually constructs. v1's `ls-tech-design` would have the same risk, so this isn't v2-unique — but the recommendation below still lands at the tech-design skill family (v1 and v2 both).

## Recommended tech-design change

When prescribing an `electron-vite` config that reserves a slot for future work, the spec must choose one of two concrete shapes, not a third "empty slot":

- **Option A (preferred for "reserved for future IPC"):** ship a minimal stub entry file alongside the config, with the config pointing at it:
  ```ts
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: { input: 'apps/panel/server/src/electron/preload.ts' },
    },
  },
  ```
  where `preload.ts` is a one-line file (`// Epic 1: preload slot reserved for Epic 2+ IPC; intentionally empty.`) that exports nothing.
- **Option B:** omit the `preload` section from the config entirely. `electron-vite` allows this. The cost is that later epics must both add the config section and the entry file, rather than just the entry file.

Either is fine; the tech-design should pick one and write it that way, because "configure the slot but leave the entry empty" is not a valid shape.

## Recommended skill change

Neither `ls-tech-design` nor `ls-tech-design-v2` currently has a "validate prescribed toolchain configs against the tool's required shape" step. This is a gap, but a costly one to close in full — the skill can't exhaustively simulate every tool's validator. A lighter mitigation that would have caught this:

- Add a check during tech-design verification that every prescribed config snippet is annotated with *what minimum shape the tool requires* at that level. For `electron-vite`, "each configured section must have a rollup input" is in the tool's own docs. An author reviewing the snippet with that constraint in mind would have caught the empty-slot issue.
- Alternatively, tech-design verifier agents could be instructed to perform a "skeptical snippet pass": for each toolchain config snippet, ask "would this validate as-is if the tool ran against it?" The answer for the preload block was no.

## Artifacts

- Failing `pnpm start` output (user's terminal, Story 7 observed-run).
- `electron.vite.config.ts` at commit N/A (pre-fix), see `git diff` at the time of this finding.
- Fix-round impl-report: `C:/Users/dsavi/AppData/Local/Temp/codex-story-7-fix-preload.impl-report.md` (iter 1 failed with wrapper exit 127 — PATH issue, see Finding 012; retried).
