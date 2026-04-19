# Finding 005 — Codex's command executor requires `workdir` to exist before the command runs (chicken/egg for `mkdir`)

**Date:** 2026-04-17
**v2-specific:** No — skill-family issue affecting any `codex-subagent` consumer on Windows (and likely Unix too). Relevant to every skill that gives Codex a task inside a to-be-created directory.
**Severity:** Low (clean failure, Codex reports it clearly, easy to work around by pre-creating the directory from the calling shell). Listed as a finding because the first-touch workaround isn't obvious from the skill examples.
**Status:** Worked around locally by pre-creating the target directory and any required files from the caller's bash before launching Codex. Skill-level documentation fix recommended.

## Summary

Codex's command execution model on Windows wraps every shell command with a `workdir` parameter passed to PowerShell. If the `workdir` does not exist at the moment the command fires, the underlying OS call fails with `Io(Os { code: 267, kind: NotADirectory, message: "The directory name is invalid." })` before the command body runs.

This creates a chicken/egg: a prompt that asks Codex to "create directory X if missing, then do work inside it" fails on command #1 because Codex cannot set `workdir=X` to run `New-Item -ItemType Directory -Force -Path X`.

## What happened (probe v2, 2026-04-17)

1. Probe v2 prompt (after the path-mapping bug from finding 004 was fixed): "Create `C:/Users/dsavi/AppData/Local/Temp/codex-probe` if missing. Inside it, write package.json and run `pnpm add`."
2. Codex correctly echoed the delivery-check marker. Delivery confirmed.
3. Codex attempted its first command:
   ```
   "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -Command
       "New-Item -ItemType Directory -Force -Path
           'C:\Users\dsavi\AppData\Local\Temp\codex-probe' | Out-Null"
   ```
4. Codex's command-execution layer invoked PowerShell with `workdir` set to the **same path it was trying to create**. The OS rejected the invocation with `NotADirectory (code 267)` because the cwd didn't exist yet.
5. Exit code `-1`. Codex honored abort-on-failure (one command, one failure, stopped), reported the error, and exited cleanly. Total: 26,265 input / 841 output tokens, ~30 seconds of Codex time.
6. Workaround: probe v3 pre-created `C:/Users/dsavi/AppData/Local/Temp/codex-probe/` + `package.json` from the caller's bash shell before launching Codex. Codex's first command was `pnpm add` in the already-existing dir. Success: typescript installed to disk.

## Impact on the run

- One wasted probe iteration (~30 seconds Codex time, 27K tokens).
- Forced the teammate to restructure the probe prompt to depend on bash pre-creating the workdir.
- Good news: Codex's error report was precise and actionable — the teammate did not need to guess what went wrong. Codex's `agent_message` included the `execution error: Io(Os { code: 267, kind: NotADirectory, message: "..." })` verbatim plus its interpretation ("This happened before the directory was created because the command was invoked with `workdir` set to `...` which did not yet exist. No further commands were run.").

## Why the skill-level controls didn't catch this

- `codex-subagent` skill examples use `cd /path/to/project && codex exec ...` assuming the project directory exists. They do not address the "Codex is being asked to CREATE a new directory" pattern.
- `ls-team-impl(*-v2)` orchestrator templates have the teammate call `codex exec` from the **repo root** (which always exists), so the issue doesn't surface for normal per-story implementation work. It surfaces for (a) probe/diagnostic flows (like the one that caught this) and (b) any skill that spawns Codex into an isolated temp workspace.

## Recommended skill changes

### 1. In `codex-subagent` skill body — add a subsection on workdir preconditions

```
### Workdir must exist before Codex starts

Codex sets the `workdir` of each subprocess command from the session's working
directory. If Codex is asked to CREATE a directory that does not yet exist and
then work inside it, the first `mkdir`/`New-Item` command will fail with
`NotADirectory (code 267)` on Windows (or similar EISDIR/ENOENT on Unix)
because the workdir itself doesn't exist.

Always pre-create any target directory from the caller's shell BEFORE
launching Codex:

    mkdir -p 'C:/path/to/workdir'
    cd /c/github/your-project && codex exec --json - < prompt.md \
        > 'C:/path/to/workdir/out.jsonl'

This is particularly relevant for diagnostic / probe flows where you spawn
Codex into a fresh throwaway directory.
```

### 2. No orchestrator change needed

Per-story Codex runs always start from the repo root, which exists. This finding only bites diagnostic / probe flows, which are ad-hoc anyway. Documentation in the skill body is the right intervention.

## Artifacts

- Codex session `019d9bd4-fa36-73b0-a6eb-68b6f178234a` (the failing probe v2). JSONL at `C:/Users/dsavi/AppData/Local/Temp/codex-probe-v2-out.jsonl`.
- Codex session `019d9bd7-8412-7693-ab5a-d9ea1b1b8f2d` (the successful probe v3 after pre-creating workdir). JSONL at `C:/Users/dsavi/AppData/Local/Temp/codex-probe-v3-out.jsonl`.

## Side observation worth flagging (not its own finding)

Probe v3 also revealed that when Codex combines multiple PowerShell statements into one `-Command` block (e.g., `pnpm add` then `Test-Path` then `Select-Object -Last 20`), the CWD can differ between statements or the pipeline can fail silently. In probe v3, pnpm succeeded (files on disk, exit 0), but Codex's in-block `Test-Path -LiteralPath "node_modules/typescript/package.json"` reported `exists: false` and the tail capture was empty. **Ground truth from the caller's bash after Codex exited** showed the file was in fact present (3620 bytes). Lesson: never trust in-block existence checks for reporting. Always re-verify from the caller's shell. This is already called out in the updated environment-rules block team-lead added for the Story 0 rerun (rule #7) — worth surfacing to the skill body as well.
