# AAMS — Academic Affairs Management System

Monorepo for a university academic affairs system: course selection / course
grabbing (抢课选课), announcements (发布消息), timetable lookup (课表查询), and
grade entry & query (成绩录入/查询).

## Rules

Standing rules. Each applies unless the current conversation says otherwise.

1. **Don't write test code unless asked.** No new `*.test.ts` or `*.test-d.ts`,
   whether adding a feature or fixing a bug. Running the existing suites is
   always fine; they must stay green.
2. **Stay inside the current package.** Don't search, read or modify anything
   outside the nearest `package.json` — from `apps/server`, that rules out
   `apps/web` and `packages/shared`. Building, formatting or type-checking a
   sibling package counts as modifying it. **Exception: agent-related files are
   out of scope** — this file, `opencode.json`, and anything under `.opencode/`
   may be read and modified from any package.
3. **Prefer `interface` to `type`** for object and record shapes. Keep `type`
   for unions, conditional types, mapped types, template literals, and aliases
   of primitives or other named types.
4. **Don't write comments unless asked.** No explanatory comments and no JSDoc
   beyond what the code around it already carries.
5. **Always reply in Chinese.** Prose, explanations, and summaries. Keep code
   identifiers, file paths, commands, and error text exactly as they are — don't
   translate them. **Exception: commit messages stay in English** and follow
   Conventional Commits — see the `commit` skill under `.opencode/skills/`.

## Stack (decided — do not re-litigate)

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Language   | TypeScript `^5.9.3` (Node `>=24.12.0`, pnpm `10.34.4`)        |
| Backend    | Express 5 via the local `express-zod` library, Zod v4         |
| Database   | MySQL + Drizzle ORM (`drizzle-orm` / `drizzle-kit`)           |
| Frontend   | Vite + React 19 + React Router 7, **no** query/data-fetch lib |
| Auth       | JWT bearer tokens                                              |
| Lint/format| Biome 2.5.12                                                   |
| Tests      | Vitest 5                                                       |

There is **no** Turborepo/Nx — orchestration is plain `pnpm -r`. Don't add one.

## Monorepo Layout (pnpm workspaces)

`pnpm-workspace.yaml` globs `apps/*` and `packages/*`.

| Package             | Owns                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| `apps/server`       | Express app, Drizzle schema/migrations, JWT auth, REST routes        |
| `apps/web`          | Vite + React SPA                                                    |
| `packages/shared`   | Zod schemas and types consumed by both sides                        |

`packages/shared` ships **source, not build output** — its `exports` points at
`./src/index.ts` and server/web consume it via `workspace:*` under
`moduleResolution: "bundler"`. Add shared code there; do not import across
`apps/*` directly, and do not add a build step to `shared` unless asked.

Dependency versions shared across packages live in the `catalog:` block of
`pnpm-workspace.yaml`. Depend on `"typescript": "catalog:"` rather than
repeating a version.

## Commands

```bash
pnpm install                # install everything

pnpm dev                    # run all packages' dev in parallel
pnpm dev:server             # Express on :3000 (tsx watch)
pnpm dev:web                # Vite on :5173

pnpm build                  # all packages, in dependency order
pnpm typecheck              # tsc --noEmit across packages
pnpm test                   # vitest run across packages
pnpm lint                   # biome lint .
pnpm format                 # biome check --write .

# Single package
pnpm --filter @aams/server typecheck
pnpm --filter @aams/web build

# A single test file
pnpm --filter @aams/server exec vitest run src/routes/schedule.test.ts

# Database (MySQL must be reachable via DATABASE_URL)
pnpm db:generate            # drizzle-kit generate — after editing schema.ts
pnpm db:migrate             # apply generated migrations
pnpm db:push                # push schema directly, no migration file (dev only)
pnpm db:studio              # Drizzle Studio
pnpm db:seed                # run src/db/seed.ts
```

`pnpm db:push` and `pnpm db:seed` need a live MySQL. Everything else —
`typecheck`, `lint`, `build` — is offline.

`vite` proxies `/api` to `http://localhost:3000` (see `apps/web/vite.config.ts`),
so the browser hits same-origin paths and CORS is not involved in development.

## TypeScript Conventions

These come from `tsconfig.base.json` and bite immediately:

- **`verbatimModuleSyntax`** — type-only imports need `import type { ... }`.
- **`rewriteRelativeImportExtensions`** — relative imports carry their real
  extension: `import x from './foo.ts'`, not `'./foo'`.
- **`exactOptionalPropertyTypes`** — `{ a?: string }` is *not* assignable from
  `{ a: undefined }`. Build optional objects conditionally or spread.
- **`noUncheckedIndexedAccess`** — `arr[0]` is `T | undefined`; this is the
  single most common new typecheck failure here.
- **`moduleResolution: "bundler"`** — no `paths` needed for `@aams/shared`;
  resolution goes through package `exports`.

## express-zod Usage

`express-zod` is your own library, published as `express-zod` and consumed here
as a normal npm dependency. Attach a schema object as the second argument to a
route verb; it validates `params`, `query`, `body`, `headers`, `cookies` and
types the handler.

```ts
new Router({ prefix: '/api' })
    .get('/courses/:id', { params: courseParams, responses: { 200: course } }, handler)
```

The exported class is **`Router`**, not `Application` — the upstream README
still shows `Application`, which does not exist in the published build. Trust
`node_modules/express-zod/dist/index.d.mts` over the README.

Only request-side schemas are checked at runtime. `responses` is **types and
OpenAPI only** — a wrong status code or body shape in a handler is a *type*
error, never a runtime guard. Validation failures reach your error middleware as
a `ZodError`.

### Traps that cost real debugging time

- **Error handlers must declare exactly 4 parameters.** The library's `~wrap`
  decides between "raw Express handler" and "responded handler" by checking
  `handler.length === 4`. Write `(err, _req, res, _next) => {}` and `res` really
  is the Express response. Drop the fourth parameter and the handler is silently
  wrapped by `toResponse`, which calls it as `(err, req, forward)` — so your
  `res` is actually the `next` function, and you get
  `TypeError: res.status is not a function` at runtime while typechecking passes.
  Unused params are fine.
- **An error handler's `err` is typed `Error`, not a narrowed subtype.** Annotate
  as `ErrorRequestHandler` and narrow inside with `err instanceof z.ZodError`.
  `ErrorRequestHandler<z.ZodError>` does not satisfy the expected signature.
- Register error handlers with `use<'error'>({ ... }, handler)`. The inline
  options literal in that call still does not infer, so lift schemas to
  variables first.
- Prefer **returning** a value from a route handler — the response adapter runs
  it through `res.json()` (never `res.send()`), so a returned number is never
  mistaken for a status code.
- Return `undefined` (or call `next()`) to fall through. Middleware registered
  via `use` never auto-calls `next()` on its own.

## Domain Model

Roles are `student`, `teacher`, `admin`. Role checks belong in a middleware that
reads the decoded JWT, not in each handler.

Modules, each owning its own router under `apps/server/src/routes/`:

- `courses` — catalog, prerequisites, capacity
- `enrollment` — 抢课选课 selection, waitlists, drop deadlines
- `schedule` — 课表查询 timetable, period/term keyed
- `grades` — 成绩录入 (teacher entry) and 成绩查询 (student view)
- `announcements` — 发布消息
- `auth` — login, refresh, profile

Grades and enrollment are the two places with real transactional and concurrency
requirements. 抢课选课 in particular is a race: the capacity check and the insert
must be one atomic operation — never `SELECT` then `INSERT` across an `await`
boundary without a transaction or a locking read.

## Environment

Copy `.env.example` to `.env` at the repo root. The server loads it via
`import 'dotenv/config'`. Required: `DATABASE_URL`, `JWT_SECRET`, `PORT`.
Never commit `.env`; it is gitignored.

## Before You Finish

Run, in this order:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Biome's `lint-staged` runs `biome lint --error-on-warnings`, so warnings fail
the commit. Fix the finding; do not reach for `--no-verify`.
