# ExLENT Program

Program management app. Attendance is the first feature: admins create classes and show a rotating QR code; students who scan it while signed in are marked present automatically.

Stack: Next.js 16 (App Router, Cache Components), Postgres + Prisma 7, Better Auth, Resend, shadcn/ui (Base UI) + Phosphor icons + Tailwind v4.

## Setup

1. `bun install` (also runs `prisma generate`)
2. Copy `.env.example` to `.env` and fill it in:
   - `DATABASE_URL`: a hosted Postgres URL (Neon/Supabase). Optional `DIRECT_URL` for migrations.
   - `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
   - `RESEND_API_KEY`, `RESEND_FROM`: until a domain is verified in Resend, `onboarding@resend.dev` only delivers to your own Resend account email.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: the first admin.
3. `bun run db:deploy` (applies `prisma/migrations`; use `bun run db:migrate` while changing the schema)
4. `bun run db:seed` creates the first admin (safe to re-run)
5. `bun run dev`

Without `RESEND_API_KEY` (outside production) emails are logged to the server console with their links instead of being sent.

## Deploying to Vercel

Vercel runs the `vercel-build` script (`scripts/vercel-build.mjs`) instead of `build`.

- **Production deploys** run `prisma migrate deploy`, then `prisma/seed.ts`, then `next build`.
  - `migrate deploy` only applies migrations that aren't recorded in the database yet, so a deploy with no schema change does nothing. It never creates migrations: when you change `prisma/schema.prisma`, run `bun run db:migrate` locally and commit the new folder in `prisma/migrations`.
  - The seed creates the first admin only when the database has **no admin**. Once any admin exists, every later deploy exits immediately. It never promotes an existing account.
  - If a migration or the build fails, the deployment fails and the previous one keeps serving.
- **Preview deploys** skip migrations and the seed, so they never write to the production database.

Environment variables to set in the Vercel project (Production):

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Pooled Neon URL (used by the app) |
| `DIRECT_URL` | Non-pooled Neon URL. Used for migrations; recommended to avoid pooler lock issues |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL` | Your production domain. If unset, the Vercel domain is used |
| `ATTENDANCE_TOKEN_SECRET` | Optional; falls back to `BETTER_AUTH_SECRET` |
| `RESEND_API_KEY`, `RESEND_FROM` | `RESEND_FROM` must be on a domain verified in Resend before you can email anyone |
| `CRON_SECRET` | Random secret used to authenticate the daily password-reset email retry cron job |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Only read on the first deploy. You can remove `ADMIN_PASSWORD` afterwards |

## How it works

- **Roles:** `ADMIN` and `STUDENT`. Public sign-up always creates a student and requires email verification. Admins are created by the seed script or by an admin inviting another admin.
- **Invites:** admins invite people from People → Students / Admins. The email link (valid 7 days, single use) lets the invitee choose a password; the address comes from the invite and counts as verified. Admins can resend or revoke.
- **Password resets:** an active reset link is valid for 24 hours and produces one durable email event. The app attempts delivery immediately; Vercel Hobby also retries pending email once daily through `/api/cron/email-outbox`. Set `CRON_SECRET` in Vercel so its scheduled request is authenticated. A temporary email outage can therefore require the person to request another link after the 24-hour window.
- **Classes:** Classes → New (name, date, description). A new class is open for check-in immediately; Close stops it. Take attendance lists every student with Present / Absent buttons, and Scan QR code (top right of that page) shows the rotating QR for students to scan. The start time and timezone are taken from the creating admin's device.
- **Missed-classes warnings:** when an admin closes a class, the app checks that class and the previous held class (closed, with at least one attendance). A verified student marked present in neither gets a warning email (and a row in `AttendanceWarning`). If they then miss the very next class too (three in a row) while that warning has been delivered, their account is scheduled for deletion (30 days, undoable on the People page). Attending any later class clears the warning and the count restarts; so does undoing a scheduled deletion. The check runs once per close under a database lock, so two admins closing at once can't double-warn; the daily cron re-runs any check that failed. Classes nobody attended are ignored, and classes closed out of order are skipped. `bun run check:attendance-concurrency` (needs `TEST_DATABASE_URL`) verifies the locking against a real database in a throwaway schema.
- **QR:** the code encodes `/attend?t=<token>` where the token is HMAC-signed, bound to the class, and valid for 60 seconds; the screen refreshes it every 30 seconds. Scanning while signed out sends the student to sign in and then records attendance automatically.
- **Visibility:** admins see everything. Students see only the classes they attended and their own profile.

## Scripts

| Script | What it does |
|---|---|
| `bun run dev` / `build` / `start` | Next.js (`vercel-build` is what Vercel runs) |
| `bun run lint` | ESLint |
| `bun test` | Unit tests (QR tokens, invites, formatting, password-reset issuance, missed-classes warnings) |
| `bun run db:migrate` / `db:deploy` / `db:seed` | Prisma migrations and the admin seed |
