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

## Current Stack (scaffolded)

- Next.js 16 (App Router) + React 19
- TypeScript, Tailwind CSS 4, ESLint 9
- npm scripts for dev/build/lint
- Custom mock homepage (`src/app/page.tsx`)

Pending decisions: database host, ORM, auth strategy, storage provider, deployment target.

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
- [x] Write and run initial migrations.
- [x] Add seed script with sample data (`npx prisma db seed`).

### 2. Backend APIs (Next.js API Routes)
- [ ] Build `/api/auth/*` (register, login, refresh, logout).
- [ ] Build `/api/posts`, `/api/tags`, `/api/authors`, `/api/media/upload`.
- [ ] Centralize validation (zod) + DB helpers in `src/lib`.
- [ ] Enforce role-based policies inside each handler.

### 3. Authentication System
- [ ] Decide on token vs session auth.
- [ ] Implement password hashing (bcrypt/argon2) and token/session storage.
- [ ] Add middleware to guard `/dashboard` routes + write endpoints.
- [ ] Ship login/register/forgot-password UI tied to custom APIs.

### 4. File & Media Storage
- [ ] Pick S3-compatible storage (S3, R2, etc.) and configure credentials.
- [ ] Implement signed upload route and helper.
- [ ] Wire uploads into dashboard forms; persist metadata to DB.
- [ ] Integrate Next.js `<Image>` for optimized delivery.

### 5. Frontend Data Integration
- [ ] Replace mock homepage props with real DB queries (server components or fetch to API).
- [ ] Build `/posts/[slug]` (full article view) and `/authors/[id]`.
- [ ] Create contributor dashboard (list, create, edit, publish, schedule posts).
- [ ] Handle optimistic updates, draft autosave, tag selector UI, validation states.

### 6. Roles & Editorial Workflow
- [ ] Extend users table with roles (contributor/editor/admin).
- [ ] Condition UI + API actions on role.
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

## Notes & Next Steps

- Current priority: finish reviewing scaffold, lock database/ORM choice, start schema design.
- Keep this README updated as milestones complete so collaborators can onboard quickly.
- Security posture: hash all credentials (bcrypt/argon2), never store plaintext secrets, restrict API output to non-sensitive fields, and rely on managed Postgres encryption + env-based secret management to minimize blast radius if data leaks.
- Prisma status: pinned to 5.21.1 for now because Prisma 7 requires driver adapters/Accelerate; plan upgrade once adapter configuration is ready (see Post-MVP Enhancements).
