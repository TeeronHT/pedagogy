# pedagogy

Collaborative blog project for me + friends. Goal: ship a custom publishing platform (frontend, backend, auth, media pipeline) while learning the entire stack hands-on.

---

## Vision & Guiding Principles

- **Contributor-friendly**: low-friction dashboard for writing, previewing, and publishing.
- **Reader-first**: fast pages, strong typography, responsive layouts, offline-friendly caching.
- **Own the stack**: build every layer manually (database, auth, APIs, storage) to deepen understanding.
- **Security-first**: treat data as sensitive from day one—encrypt secrets, enforce least privilege, and harden the deployment pipeline.
- **Maintainable**: typed codebase, tests, CI, docs, and clear branching strategy.

---

## Current Stack (implemented so far)

- Next.js 14 (App Router) + React 19 preview
- TypeScript, Tailwind CSS, ESLint 9 (flat config)
- Prisma ORM + PostgreSQL 16 (Docker locally, managed later)
- NextAuth (Auth.js) with GitHub OAuth, Prisma adapter, database sessions, middleware-protected dashboard
- npm scripts + `scripts/setup-local.sh` for install/migrate/seed, plus `tsx` + `bcryptjs` for scripted seeding
- Custom homepage split into server (`app/page.tsx`) + client (`components/GardenExperience.tsx`) layers that read directly from Prisma

---

## Repository Layout

```
Pedagogy/
├─ README.md          # Project overview (this file)
└─ blog-site/        # Next.js app
   ├─ src/app/       # App Router (pages, layouts, API routes)
   ├─ public/        # Static assets
   ├─ package.json   # Dependencies/scripts
   └─ ...others
```

As we add services (e.g., infra scripts, Prisma schema), document them here.

---

## Development Workflow

1. Pull latest, run `npm install` inside `blog-site/`.
2. Copy `.env.example` ➜ `.env.local`, fill secrets.
3. `npm run dev` for local preview.
4. Implement feature on a branch, write/adjust tests.
5. `npm run lint && npm run build` before committing.
6. Open PR, review, merge to main, deploy.

### Local setup checklist

- **One command:** `npm run local:setup` (starts Docker Postgres, migrates, seeds).
- **Start Postgres (Docker):**
  ```bash
  docker run --name pedagogy-postgres \
    -e POSTGRES_PASSWORD=localdev \
    -p 5432:5432 \
    -d postgres:16
  docker exec -it pedagogy-postgres psql -U postgres -c "CREATE DATABASE pedagogy;"
  ```
- **Generate client & run migrations:**  
  `npx prisma generate`  
  `npx prisma migrate dev --name init`
- **Seed sample content:** `npx prisma db seed`
- **Preview the site:** `npm run dev` then visit `http://localhost:3000` to see the seeded posts rendered.
- **Stop Docker when done:** `docker stop pedagogy-postgres` (and `docker rm pedagogy-postgres` if you want a clean slate next time).

### Authentication setup

Create or update `blog-site/.env.local` with the following variables (GitHub OAuth example):

```
AUTH_SECRET=your-random-string
AUTH_GITHUB_ID=your-github-oauth-client-id
AUTH_GITHUB_SECRET=your-github-oauth-client-secret
AUTH_URL=http://localhost:3000
```

Generate `AUTH_SECRET` via `openssl rand -base64 32`. The GitHub OAuth app must have its callback URL set to `http://localhost:3000/api/auth/callback/github`. Once those are in place, `npm run dev` ➜ visit `/dashboard` ➜ NextAuth’s GitHub sign-in flow will run, persist the user, and redirect back once authorized.

### API surface (read-only for now)

- `GET /api/posts` – returns the same `GardenPost` payload rendered on the homepage (title, excerpt, hero image, tags, author info, publishedAt, readTime).
- `GET /api/tags` – list of tags with post counts (useful for filters/trending sections).

Both endpoints are unauthenticated, purely for read operations so the personal site or other consumers can fetch content without touching Prisma directly.

### Contributor dashboard (work in progress)

- `/dashboard` – server-rendered table showing every post’s title, status, author, and last updated timestamp. Edit/Delete buttons are present as disabled placeholders; we’ll wire them up after auth + mutations land. This is the foundation for the internal CMS experience.

---

## DIY Implementation Roadmap

### 0. Baseline Repo
- [x] Review scaffolded Next.js structure and clean unneeded files.
- [ ] Create issue templates / CONTRIBUTING notes if needed.

### 1. Database & ORM Layer
- [x] Select database host (local Docker Postgres for dev, managed Postgres/Neon for prod).
- [x] Choose ORM/migration tooling (Prisma) and initialize.
- [x] Model tables: `users`, `authors`, `posts`, `tags`, `post_tags`, `media`, `sessions`.
- [ ] Enforce encryption at rest (managed provider) and protect secrets via env vars / secret manager.
- [x] Write and run initial migrations (including Auth.js adapter tables).
- [x] Add seed script with sample data (`npx prisma db seed`).

### 2. Backend APIs (Next.js API Routes)
- [x] Expose read-only `/api/posts` + `/api/tags` for the homepage + consumers.
- [x] Wire `/api/auth/[...nextauth]` to NextAuth (GitHub OAuth, Prisma adapter).
- [ ] Add `/api/authors`, `/api/media/upload`, and post mutation routes (create/update/delete).
- [ ] Centralize validation (zod) + DB helpers in `src/lib`.
- [ ] Enforce role-based policies inside each handler.

### 3. Authentication System
- [x] Decide on session-based auth (NextAuth database sessions).
- [x] Implement OAuth login via GitHub + Prisma adapter; persist sessions/tokens.
- [x] Add middleware + server checks guarding `/dashboard`.
- [ ] Ship auxiliary flows (custom credentials, forgot-password) if needed later.
- [ ] Build sign-out + account management UI in the dashboard shell.

### 4. File & Media Storage
- [ ] Pick S3-compatible storage (S3, R2, etc.) and configure credentials.
- [ ] Implement signed upload route and helper.
- [ ] Wire uploads into dashboard forms; persist metadata to DB.
- [ ] Integrate Next.js `<Image>` for optimized delivery.

### 5. Frontend Data Integration
- [x] Replace mock homepage props with real DB queries (server components + Prisma).
- [x] Create contributor dashboard shell (list/filter, highlight current user).
- [ ] Build `/posts/[slug]` (full article view) and `/authors/[id]`.
- [ ] Wire dashboard actions for create/edit/publish once APIs exist.
- [ ] Handle optimistic updates, draft autosave, tag selector UI, validation states.

### 6. Roles & Editorial Workflow
- [x] Extend users table with roles (contributor/editor/admin) + surface via session.
- [ ] Condition UI + API actions on role (contributors vs editors/admins).
- [ ] Add review/publish toggles, approval queues, audit trail.

### 7. Testing & Quality Gate
- [ ] Configure ESLint + Prettier + type-check (`tsc --noEmit`).
- [ ] Add unit tests (utilities, hooks) via Vitest/Jest.
- [ ] Add integration tests for API routes (Supertest/Next test utils).
- [ ] Add Playwright/Cypress smoke tests for key flows (login, post creation, publish).
- [ ] Setup GitHub Actions (lint, test, build, preview deploy).

### 8. Deployment & Operations
- [ ] Provision production DB + storage, run migrations there.
- [ ] Configure prod env vars (DB URL, auth secrets, storage keys).
- [ ] Deploy Next.js app (Vercel/Fly/Render). Ensure API routes work in prod.
- [ ] Enable logging/monitoring (Vercel logs, Sentry, betterstack).
- [ ] Document backup/restore + incident response steps.

### 9. Post-MVP Enhancements
- [ ] Comments (custom or Giscus).
- [ ] RSS feed + sitemap generation.
- [ ] Email notifications / webhooks for new posts.
- [ ] Additional auth providers (Google, GitHub), invitations.
- [ ] Embeddable widgets for personal site (latest posts section).
- [ ] Upgrade Prisma to 7.x once driver adapter / Accelerate configuration is in place.

---

## Security posture & considerations

- **Secrets management**: `.env.local` stays untracked; production env vars must live in the hosting platform’s secret manager. Rotate `AUTH_SECRET`, OAuth credentials, and database passwords on a schedule.
- **Database sensitivity**: `Account` rows store OAuth refresh/access tokens and `Session` rows hold hashed session tokens. Limit who can reach the database, enable disk/volume encryption (FileVault locally, managed encryption in prod), and keep backups encrypted.
- **Least privilege**: Lock `/dashboard` behind middleware now, and enforce role checks in every mutating API before launch. Contributors should only touch their drafts; editors/admins handle publish/delete.
- **PII minimization**: Avoid storing anything beyond name/email/avatar. If more personal data is needed, document why and consider encryption at the field level.
- **Package hygiene**: continue running `npm audit`, pin Prisma 5.21.1 until we adopt Prisma 7 driver adapters, and track upgrades in “Post-MVP Enhancements”.
- **Operational readiness**: log access attempts, plan for incident response (revoking tokens by deleting `Account` rows, wiping sessions via `Session` table).

## Notes & Next Steps

- Current priority: wire role-aware dashboard controls + post mutation APIs so contributors can create drafts and editors can publish.
- Keep this README updated as milestones complete so collaborators can onboard quickly.
- Upcoming focus areas: enforce role policies in API routes, add `/posts/[slug]`, build editor UI for drafting/publishing, and design admin tooling for role changes.
- Prisma status: pinned to 5.21.1 for now because Prisma 7 requires driver adapters/Accelerate; plan upgrade once adapter configuration is ready (see Post-MVP Enhancements).
