---
name: quick-path
description: >
  Fast-path for trivial tasks that don't need the full pipeline. Use for bugfixes, small refactors,
  single-file changes, documentation, or config tweaks. Bypasses architect/test-writer/review-loops.
  Trigger for: "quick fix", "hotfix", "simple change", "just fix", "pequena correção",
  "/quick", "fast path", "skip pipeline".
  Supports flags: --discuss (clarify first), --test (write tests), --review (run code-reviewer).
---

# Quick Path — Fast-Track for Trivial Tasks

You are the fast-path executor. Use this when the full pipeline is overkill.

## When to Use Quick Path

| Use Quick Path | Use Full Pipeline |
|----------------|-------------------|
| Single-file bugfix | New feature spanning multiple layers |
| Typo / naming correction | New VO, entity, or aggregate |
| Config change (deno.json, Dockerfile) | New use case or endpoint |
| Style/token adjustment | New page or complex component |
| Adding a test for existing code | Anything touching auth/session/security |
| Small refactor within one layer | Cross-boundary refactor |
| Documentation update | New bounded context |

## Decision Rule

**If the change touches 3+ files across 2+ layers → use full pipeline.**
**If the change touches auth, session, middleware, or security → use full pipeline.**

When in doubt, ask: "Would a code-reviewer need to verify architectural boundaries?" If yes → full pipeline.

---

## Flags

| Flag | What It Does | Default |
|------|-------------|---------|
| `--discuss` | Ask clarifying questions before implementing | OFF |
| `--test` | Write/update tests for the change | OFF |
| `--review` | Run code-reviewer on the result | OFF |
| `--security` | Run secure-code-reviewer on the result | OFF |

Flags can be combined: `/quick --test --review`

---

## Execution Flow

### 1. Classify (always)

Read the request. Determine:
- **Files affected** (list them)
- **Layers touched** (domain / application / adapters / client)
- **Risk level**: low (typo, style) | medium (logic change) | high (security-adjacent)

If risk is HIGH → **abort quick path**, tell user to use full pipeline.

### 2. Discuss (if --discuss or if ambiguous)

Short clarification. Max 3 questions. No CONTEXT.md file — just conversation.

### 3. Implement

- Read the target file(s) first
- Follow the layer's skill (domain-expert, adapter-expert, etc.)
- Follow ALL rules from CLAUDE.md for that layer
- No shortcuts on quality — quick path skips process, not standards

### 4. Test (if --test)

- Write or update tests following project conventions (Deno.test + @std/assert)
- Run tests: `deno task test` to verify zero regressions
- If tests fail, fix and re-run (max 3 attempts)

### 5. Verify (always)

Minimal verification checklist:
- [ ] `deno check` passes (type check)
- [ ] `deno lint` passes
- [ ] `deno task test` passes (zero regressions)
- [ ] Change follows CLAUDE.md rules for the affected layer

### 6. Review (if --review)

Spawn code-reviewer agent on the changed files only.
If violations found, fix them (max 2 rounds).

### 7. Report

Short summary to user:
```
Quick fix applied:
- Changed: src/domain/kernel/cpf.ts (line 42)
- What: Fixed regex for CPF with leading zeros
- Verified: deno check + lint + test all GREEN
```

---

## Traceability (lightweight)

Quick Path still creates a minimal audit trail for compliance with pipeline rules:
- Creates `.pipeline/<ticket>/000-request.md` with scope and rationale for quick-path
- Appends a one-line entry to `.pipeline/<ticket>/REPORT.md` on completion
- Does NOT create full agent REPORT.md files or multi-phase STATE.md

## What Quick Path Does NOT Do

- Does not run the full review loop (unless --review)
- Does not run security audit (unless --security)
- Does not spawn domain-architect or test-writer
- Does not update STATE.md with phase transitions

## Safety Net

If during implementation the maestro discovers the change is **larger than expected** (e.g., fixing a bug requires touching 4 files across domain + adapters), it MUST:
1. STOP implementation
2. Tell the user: "This is bigger than a quick fix. Switching to full pipeline."
3. Create 000-request.md and proceed with pipeline-maestro
