# Finding 004 — `/tmp/` path divergence between Claude's Write tool and Git Bash on Windows silently breaks Codex prompt delivery

**Date:** 2026-04-17
**v2-specific:** No — this is a skill-family issue that will bite any skill where a Claude Code teammate on Windows composes prompts via the `Write` tool and hands them to a CLI via a bash pipe (`codex exec - < /tmp/prompt.md`, `claude -p - < /tmp/...`, `copilot -f /tmp/...`, etc.).
**Severity:** High (silent correctness failure — Codex received an empty prompt and hallucinated a "Story 0 attempt" with no environment rules, then reported the hallucinated results as if they were real).
**Status:** Worked around locally by using absolute Windows-style paths (`C:/Users/dsavi/AppData/Local/Temp/<name>`). Skill-level fix recommended.

## Summary

On the user's Windows 10 box with Git Bash (MSYS2):

- **Claude's `Write` tool** resolves `/tmp/foo` to `C:\tmp\foo` (a directory at the C: root).
- **The `Bash` tool (git bash)** resolves `/tmp/foo` to `C:\Users\dsavi\AppData\Local\Temp\foo` (the `%TEMP%` directory). Confirmed by `cygpath -w /tmp` → `C:\Users\dsavi\AppData\Local\Temp`.

These are two *different* directories. The implementer teammate composed a 11,970-byte Story 0 prompt via Write tool (landed in `C:\tmp\`). Then ran `codex exec - < /tmp/codex-story-0-prompt.md` from bash, which read a **0-byte placeholder file** the teammate had earlier created via `touch /tmp/...` from bash (landed in `C:\Users\dsavi\AppData\Local\Temp\`). Codex thus received an empty prompt on stdin.

## What happened (Story 0 attempt 2)

1. Session started. Teammate followed the v2 retry plan documented in `RESTART-INSTRUCTIONS.md`, including the Windows Codex Hardening rule requiring `--dangerously-bypass-approvals-and-sandbox`.
2. Teammate composed the full Story 0 prompt via the `Write` tool at path `/tmp/codex-story-0-prompt.md`. Write tool reported success. The prompt actually landed at `C:\tmp\codex-story-0-prompt.md` (11,970 bytes of real instructions including the environment-rules block that forbids `link:` fallbacks).
3. Earlier in the session, teammate had run `touch /tmp/codex-story-0-prompt.md` from bash to "ensure file exists before Write" — this created a 0-byte file at `C:\Users\dsavi\AppData\Local\Temp\codex-story-0-prompt.md`. That file was never overwritten, because Write went to a different path.
4. Teammate launched `codex exec --json --dangerously-bypass-approvals-and-sandbox - < /tmp/codex-story-0-prompt.md > /tmp/codex-story-0-impl.jsonl 2>/dev/null`. Bash resolved `/tmp` to `%TEMP%`, so Codex received the **0-byte placeholder** on stdin.
5. Codex, receiving an empty prompt, still produced a 558 KB / 248-line JSONL transcript — gpt-5.4 hallucinated a Story 0 implementation attempt from residual context (probably "recent system state" from the ongoing conversation visible to the model in some way). It ran `pnpm install` attempts, hit real Windows-level failures (Corepack EPERM, ECONNREFUSED 127.0.0.1:9, rename EPERM), and fell back to emitting `link:` dependencies — **exactly the attempt-#1 regression** we had the environment-rules block to prevent. Because the rules block never reached Codex, the rules were not in effect.
6. Codex's final `agent_message` reported "26 files created" — but none of them persisted to disk. `git status` was identical to pre-run.
7. Teammate initially attributed this to a new Windows sandbox or Codex-internal issue, spent effort on shell-level diagnostics, and only discovered the path-mapping bug while running a probe rerun (the probe hit the SAME bug: Write wrote to `C:\tmp\codex-probe-prompt.md` while bash piped `%TEMP%\codex-probe-prompt.md` to Codex).
8. Resolution: use absolute Windows-style forward-slash paths (`C:/Users/dsavi/AppData/Local/Temp/<name>`) for all prompt files. Both Write and bash resolve these identically.

## Impact on the run

- ~25 minutes and one full Codex invocation (~6.6M input tokens, 31K output) wasted on an under-prompted "Story 0 attempt 2."
- A full shell-level diagnostic cycle (pnpm config list, npmrc audit, isolated pnpm install test) executed on a false hypothesis.
- Two probe runs (codex-probe-v2, codex-probe-v3) needed to decouple root cause from symptoms.
- Net delay to Story 0 of roughly 30–45 minutes plus additional Codex budget consumed on the throw-away "attempt 2."
- One security note surfaced as a side-effect: `pnpm config list` leaks a plaintext `_authToken` for `registry.npmjs.org` because pnpm derives the `_authToken` display form from the `_auth` token in `~/.npmrc`. This would be worth flagging in any diagnostic playbook that runs `pnpm config list` — redact the output before sharing.

## Why the skill-level controls didn't catch this

- The `codex-subagent` skill body uses `/tmp/codex-out.jsonl` and `/tmp/codex-prompt.md` throughout its examples. No mention of Windows path divergence.
- The `ls-team-impl` + `ls-team-impl-v2` orchestrator templates likewise show `/tmp/codex-*.{md,jsonl}` paths and do not flag the Windows issue.
- The v2 Windows Codex Hardening section in `team-impl-log.md` (finding 001's mitigation) inherits the same `/tmp/` pattern in its canonical invocation examples. **It does not prevent this bug — in fact its examples *show* the buggy pattern.**
- Codex-subagent's `codex-result` extractor silently returned empty for session-id, last-message, and commands when the JSONL was 0-byte, but did not error loudly enough to draw the teammate's attention to the real cause.
- There is no built-in "delivery assertion" step — nothing forces the teammate to verify that Codex actually received the prompt. The teammate added one (`DELIVERY_CHECK_MARKER_ECHO_7077`) only after the diagnosis; it should be standard.

## Recommended skill changes

### 1. In `codex-subagent` skill body — Windows path convention

Add a Windows-specific note near the existing Config Defaults table:

```
### Windows note on /tmp paths

Git Bash and Claude's built-in tools resolve `/tmp/` differently on Windows:
- Claude's Write tool → C:\tmp\
- Git Bash (%TEMP%)   → C:\Users\<user>\AppData\Local\Temp\

NEVER use `/tmp/` for files that both the Write tool and `codex exec` via
bash need to read. Use an absolute Windows path with forward slashes:

    C:/Users/<user>/AppData/Local/Temp/codex-prompt.md

Write and bash resolve these identically. Alternately, use the `%USERPROFILE%`
or `~/.claude/tmp/<session>/` convention if the session already has a
dedicated temp directory.
```

### 2. In `ls-team-impl(*-v2)` skill body — mandatory delivery assertion

Add to every teammate's Codex-exec step:

```
Every Codex prompt MUST include, as its first environment rule:

  FIRST THING: echo <UNIQUE_MARKER> before anything else.

After Codex exits, the teammate MUST verify the marker appears in the JSONL:

  grep -c <UNIQUE_MARKER> <output.jsonl>

Expected ≥1. If 0, the prompt did not reach Codex — STOP. Do not trust any
reported results. Investigate path delivery, stdin pipe, or Codex config.
```

This is 4 lines of orchestration, and it deterministically catches this bug (and any future pipe-delivery failure) on round one.

### 3. In `codex-subagent` `codex-result` extractor — loud empty-input detection

When `codex-result last` or `codex-result session-id` sees a 0-byte or malformed JSONL, print a warning like:

```
WARNING: <file> is empty or malformed. This usually means Codex received
no input on stdin (prompt file was empty or unreachable) or crashed before
emitting any events. Verify the prompt file exists and has content.
```

Currently it returns silently, which is easy to miss.

### 4. Cross-skill: teach teammates to distrust "empty prompt hallucinations"

The most insidious part of this bug is that Codex did not fail — it produced a plausible-looking transcript with `command_execution` items, a `turn.completed` event, and a 31K-token `agent_message` summary. Only the fact that `git status` showed zero on-disk changes revealed that the whole run was hallucinated.

Skill bodies should explicitly warn: if Codex reports "I created these 26 files" but `git status` shows nothing, treat it as a prompt-delivery failure until proven otherwise. Don't spend budget investigating what Codex reported — investigate whether Codex got the right input.

## Artifacts

- Codex JSONL transcripts (all on `%TEMP%`, which is `C:\Users\dsavi\AppData\Local\Temp\`):
  - `codex-story-0-impl.jsonl` — the hallucinated "attempt 2" run, 558 KB / 248 events.
  - `codex-probe-v2-out.jsonl` — first probe rerun; workdir chicken/egg failure with marker echo (see finding 005).
  - `codex-probe-v3-out.jsonl` — successful pnpm install probe proving registry access works.
- Evidence of path divergence: `cygpath -w /tmp` → `C:\Users\dsavi\AppData\Local\Temp`; `ls -la C:/tmp/codex-story-0-prompt.md` → 11,970 bytes; `ls -la /tmp/codex-story-0-prompt.md` → 0 bytes.
- Mitigation encoded in this session's team-impl-log.md under §Windows Codex Hardening (will be updated post-recovery).
