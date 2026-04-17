# Finding 007 — Working pattern for Windows Codex runs (positive finding)

**Date:** 2026-04-17
**v2-specific:** No — applies to any skill using `codex-subagent` on Windows.
**Severity:** N/A (this is a positive finding — the compound mitigation pattern that actually landed Story 0 green after 5 prior failed attempts).
**Status:** Proven end-to-end — Story 0 accepted with full `pnpm verify` green, 3 tests passing, zero `link:` regressions.

## Summary

Story 0 took four attempts + one diagnostic cycle + a production harness build before landing. The combined mitigation pattern that finally worked is the sum of every prior finding. Recording the complete pattern here so future work (Story 1 onward, and upstream skill refinement) inherits it as a single package rather than re-deriving each piece.

## The working pattern (copy-paste ready)

### A. Prompt side — mandatory environment-rules block (9 rules)

Every Codex prompt prepends this block verbatim. Every rule has a specific failure it prevents.

```
=== ENVIRONMENT RULES ===

1. FIRST THING: echo <UNIQUE_MARKER> before anything else.
   Skip this check and the run is invalid.

2. Working directory only — never scan C:\github, C:\Users, or any directory
   outside C:/github/<project>. The epic / tech design / story paths are all
   you need. Recursive cross-repo scans waste budget.

3. Use the npm registry for dependencies — never use `link:` paths. Install
   packages from the registry via pnpm with declared semver ranges.

4. Do NOT run `corepack enable`. Do NOT invoke corepack at all. The machine
   has pnpm <N.N.N> globally installed at /c/<abs-path-to-pnpm> — use it
   directly for any pnpm invocation.

5. If any command fails, STOP and report the exact error. Do NOT fall back
   to `link:` paths, do NOT retry with workarounds, do NOT edit package.json
   or tests to paper over failures. Abort and report.

6. If `apply_patch` fails for any file, fall back to rewriting that file in
   full via a single write. Do not retry apply_patch for the same file.

7. When composing combined PowerShell blocks, the CWD may not carry across
   statements. Use absolute paths for any Test-Path / ls / existence checks.
   Report only on subprocess exit codes — don't trust in-block existence
   checks for final reporting. Ground truth will be re-verified from the
   caller's bash after you exit.

8. Delete transient `pnpm-lock.yaml.<digits>` backup files before finishing —
   only `pnpm-lock.yaml` itself should remain.

9. If a command fails with exit code -1073741502 AND empty stdout/stderr,
   that is the Windows STATUS_DLL_INIT_FAILED flake. Retry that exact command
   up to 3 times with a 2-second delay between attempts. Do NOT apply this
   retry logic to any other exit code. If it still fails after 3 retries,
   treat as a real failure per rule 5.
```

**What each rule prevents:**

| Rule | Failure it blocks | Source |
|------|-------------------|--------|
| 1 | Empty-prompt hallucination (bash pipe receives empty file) | finding 004 |
| 2 | Cross-repo recursive scans that time out or find `link:` candidates | finding 001 |
| 3 | `link:` fallback when network/install fails | finding 001 |
| 4 | Corepack EPERM on Windows AppData (observed even under bypass flag) | finding 001 |
| 5 | `link:` fabrication, silent test edits, test loosening | finding 001 |
| 6 | Stuck `apply_patch` crashes under restricted-token sandbox | finding 001 |
| 7 | False "Test-Path returned false" reports when install actually succeeded | finding 005 side observation |
| 8 | Stray lockfile backups polluting the repo | finding 001 |
| 9 | Single-command PowerShell launch flakes aborting the whole session | finding 006 |

### B. Shell side — absolute Windows paths, not `/tmp/`

Write tool and Git Bash resolve `/tmp/` to different directories on Windows. Use `C:/Users/<user>/AppData/Local/Temp/<name>` for all Codex input prompts and output JSONL files. Both tools resolve this identically (finding 004).

### C. Launcher wrapper — auto-retry on flake only

Never run `codex exec` directly. Always go through the wrapper:

```
bash /path/to/run-codex-with-retry.sh \
    <prompt.md> <out.jsonl> [max_retries] \
    --delivery-marker <MARKER> \
    --expect-path <abs-path>... \
    --link-grep-glob <glob>...
```

The wrapper:
1. Runs `codex exec --json --dangerously-bypass-approvals-and-sandbox - < prompt > out.jsonl`.
2. Delegates verdict to `check-codex-completion.sh` (the ground-truth checker).
3. Retries ONLY on `FLAKE_DETECTED` (exit 12). All other verdicts pass through so real errors aren't papered over.
4. Saves flaky attempt JSONLs as `<out>.flake-attempt-<N>.jsonl` for audit.

### D. Completion checker — ground truth, not Codex's self-report

`check-codex-completion.sh` reads the JSONL plus optional expectations and returns a stable exit code:

| Exit | Meaning | Action |
|------|---------|--------|
| 0 | OK — everything passed | Proceed |
| 10 | EMPTY_JSONL | Prompt didn't land; investigate delivery |
| 11 | NO_DELIVERY_MARKER | Prompt delivered but marker missing; Codex may have skipped the echo |
| 12 | FLAKE_DETECTED | `-1073741502` with empty output; retry-safe |
| 13 | REAL_ERROR | Legit command failure; investigate, do not retry |
| 14 | LINK_REGRESSION | A package.json has `link:` paths; reject (finding 001 catch) |
| 15 | DELIVERABLES_MISSING | Codex reported success but expected paths absent |
| 16 | NO_TURN_COMPLETED | Codex crashed mid-turn |

It also writes a human-readable `.completion-report.txt` alongside the JSONL. Callers (me, team-lead, future teammates) `cat` the report instead of re-deriving the verdict.

**The critical insight:** Codex's own `turn.completed` event and final `agent_message` are not authoritative for correctness. Empty-prompt hallucinations produce plausible-looking transcripts. Workdir-quirk PowerShell combos produce wrong in-block existence checks. The ONLY authority is the checker's verdict against the JSONL + the on-disk state.

### E. Proactive completion handling

When a background Codex job exits, check the JSONL immediately — do not wait for the user to ask. The background-task notification is the signal to:

1. Run the checker against the JSONL.
2. Read the verdict file.
3. Take action: retry (flake), report (real error), accept (OK).

Passively waiting on "Codex is still running" when `turn.completed` already landed minutes ago is the anti-pattern we hit twice on this run.

## What changes in skill bodies

### 1. `codex-subagent`

- Document the Windows path convention (§B).
- Ship the launcher wrapper + completion checker as reference scripts.
- Document the JSONL field names (`exit_code`, NOT `exit` as `codex-result` abbreviates).
- Add a "Windows flake handling" subsection that explains `STATUS_DLL_INIT_FAILED` and the shell-level + prompt-level retry strategy.

### 2. `ls-team-impl(*-v2)`

- Every implementer/reviewer teammate prompt includes the 9-rule environment-rules block verbatim with the delivery marker parameterized per-story (so each story has a unique marker).
- Every `codex exec` invocation goes through the wrapper, not raw.
- Every completion is auto-checked before any report-out. The teammate MUST consult the `.completion-report.txt` before composing the SendMessage back to the team lead.
- Document that "Codex said it finished" ≠ "the work landed." Require ground-truth verification from caller bash (file existence, gate runs) before acceptance.

### 3. Global user memory

Add a feedback memory capturing the pattern so future Claude Code sessions on this machine inherit it. Key items:
- `/tmp/` path divergence → use `C:/Users/<user>/AppData/Local/Temp/`
- Always launch Codex via the retry wrapper
- The 9-rule environment-rules block is load-bearing; don't skip any rule
- Always check ground truth on disk after Codex exits; don't trust the `agent_message`

## Evidence this pattern works

- **Story 0 went from 5 consecutive failures → green on attempt 5** using this stack.
- `pnpm verify` → exit 0 (3 tests pass in `apps/panel/shared/src/errors/codes.test.ts`).
- `pnpm red-verify` → exit 0 (format:check + lint + typecheck all clean).
- `grep -rn '"link:' apps/*/package.json package.json` → 0 matches.
- 14/14 expected scaffold files on disk, verified by the completion checker.
- Repo layout matches tech-design §Workspace Layout exactly.

## Residual gotchas worth calling out

- **The flake still happens even with the full pattern — and Story 1 revealed a second, stronger mode.** Prompt Rule 9 + wrapper-level retry handle per-command occurrences, but Story 1 attempts 1 and 2 hit **session-wide walls** — every PowerShell spawn from `item_0` onward fails with `-1073741502`. Rule 9 is useless against this; the only fix is killing the Codex session and spawning a fresh `codex exec`. Full writeup: [`009-session-wide-codex-flake-walls.md`](009-session-wide-codex-flake-walls.md). **Two adjustments this implies for finding 007's pattern going forward:** (a) bump the wrapper's default retry cap from 2 to 3 (Story 1 needed exactly 3 total attempts to escape the wall, leaving the old cap with zero slack); (b) add a wall-detection short-circuit to the env-rules block so walled sessions abort after 3 consecutive command flakes from item_0 instead of burning per-command retry budget.
- **Codex still occasionally hallucinates Biome 1.x syntax** (`files.ignore` instead of `files.includes`). Not a sandbox issue — just a gpt-5.4 knowledge-cutoff artifact. Fixable in-place after red-verify surfaces it.
- **Codex's `agent_message` can be inaccurate about file state** because of the CWD-drift-in-combined-PowerShell issue (finding 005 side observation). Example: this pattern produced a "typescript not on disk" claim while typescript was in fact at the expected path. Always ground-truth with your own `ls` before trusting.
- **The retry wrapper is written in Bash with Python fallback for JSONL parsing.** It depends on `python3` being on PATH for the most accurate flake classification. Without python3, it falls back to a cruder grep heuristic that still works but doesn't distinguish "-1073741502 with empty output" from "-1073741502 with real error text." Make sure `python3` is available on any machine running this wrapper.

## Artifacts

- Launcher wrapper: `C:/Users/dsavi/AppData/Local/Temp/codex-retry/run-codex-with-retry.sh` (~3 KB)
- Completion checker: `C:/Users/dsavi/AppData/Local/Temp/codex-retry/check-codex-completion.sh` (~8 KB)
- Reference prompts that work:
  - Story 0 scaffold: `C:/Users/dsavi/AppData/Local/Temp/codex-story-0-v3-prompt.md`
  - Probe template (for smoke-testing Codex after any env change): `C:/Users/dsavi/AppData/Local/Temp/codex-probe-v3-prompt.md`
- Green run JSONL: `C:/Users/dsavi/AppData/Local/Temp/codex-story-0-v3-impl.jsonl` (the Story 0 scaffold turn with 14 files landed)
- Related findings: 001 (Windows sandbox), 004 (path divergence), 005 (workdir chicken/egg), 006 (flake detection + bugs in first wrapper).

## Recommended next actions

1. **Propose a PR to the `codex-subagent` skill** containing the launcher + checker scripts with Windows-specific documentation.
2. **Propose a PR to `ls-team-impl(*-v2)`** that wires the wrapper into every teammate template and adds the completion-check ceremony to the orchestrator.
3. **Persist the pattern in user memory** so this machine's future Claude sessions inherit it without re-deriving.
4. **Monitor Story 1 and onward** — if the pattern holds through at least 3 more stories without modification, it's stable enough to ship upstream.
