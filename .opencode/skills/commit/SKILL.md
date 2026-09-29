---
name: commit
description: Stage changes and commit with English Conventional Commits format, running the lint/typecheck/test gate first. Use when the user wants to commit, save changes, or says "commit", "提交", "git commit", or "save".
---

# Commit

Stage changes and create a commit in the English Conventional Commits format
this project uses.

## Workflow

### Phase 1: Check Changes

```bash
git status
git diff
```

If there is nothing staged or modified, stop and say so. Never invent a commit
for an empty working tree.

If untracked files exist, call them out before adding — new source files are
usually intended, but so are stray logs, `.env`, and editor droppings. `.env` is
gitignored and must never be staged; if it somehow appears, unstage it and say
why.

### Phase 2: Verify

Run the gate before staging. Every commit in this repo must pass it.

```bash
pnpm lint && pnpm typecheck && pnpm test
```

If it fails, stop and report the failure. Do not commit known-broken code and do
not "fix" it by loosening the check.

### Phase 3: Stage

```bash
git add .
```

### Phase 4: Write the Message

Conventional Commits, **in English**, as `type(scope): description`.

Pick the scope from the changed paths:

| Changed path                          | Scope     |
| ------------------------------------- | --------- |
| `apps/server/**`                      | `server`  |
| `apps/web/**`                         | `web`     |
| `packages/shared/**`                  | `shared`  |
| root config, `AGENTS.md`, `.opencode/`| *(omit)*  |

Pick the type from what the change *does*:

| Type       | Use for                                            |
| ---------- | -------------------------------------------------- |
| `feat`     | new user-visible capability                        |
| `fix`      | bug fix                                            |
| `refactor` | behaviour-preserving restructure                   |
| `docs`     | documentation only                                 |
| `chore`    | deps, config, tooling, scaffolding                 |
| `ci`       | GitHub Actions, husky, lint-staged wiring          |

A schema migration accompanying a new feature is part of that `feat` — do not
split it into a second commit. Schema changes with no behaviour change are
`chore(db)`.

### Phase 5: Commit

Single logical change:

```bash
git commit -m "feat(server): add course catalog endpoints"
```

Multiple distinct changes: one commit with a bullet body.

```bash
git commit -m "feat(server): add enrollment waitlist support

- Add waitlist table and Drizzle schema
- Promote from waitlist when a seat is dropped
- Expose waitlist position in the enrollment response"
```

## Message Rules

- **English, always** — matching the existing history. This is the one place
  that does not follow the "reply in Chinese" rule in `AGENTS.md`.
- Lowercase the description after the colon; no trailing period.
- Imperative mood: "add", not "added" or "adds".
- Describe *why* when it isn't obvious from the diff. "fix(server): guard
  capacity check with a transaction" beats "fix(server): update enrollment".
- One concern per commit. If the subject needs "and", split it.

## Hooks

A husky `pre-commit` hook runs lint-staged, which invokes
`biome lint --error-on-warnings`. **Warnings fail the commit.** If the hook
rejects a change, fix the finding and commit again.

Never reach for `--no-verify` to get past the hook. If a hook is genuinely
broken rather than the code, say so and ask before bypassing.

## Related

This repo runs Biome, not Prettier or ESLint — do not add or invoke those.
Changes to `biome.json` or husky config are `chore`, and they need a human
reviewer.
