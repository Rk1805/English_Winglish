# English Winglish — # by Nikunj Sir

Competitive-exam English preparation app for Gujarat & India: grammar practice,
previous year questions (GPSC, GSSSB, SSC, Railway, Banking, Police, Talati,
TET/TAT/HTAT, UPSC…), mock tests, PDFs, videos and notes. Bilingual
English/Gujarati content.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.

## Repo layout

| Folder | What it is | Stack |
|---|---|---|
| `app/` | Student mobile app | React Native (Expo) + Supabase |
| `admin/` | Admin panel (questions, content, users) | Next.js + Supabase |
| `supabase/` | Database schema, seed data | PostgreSQL migrations |
| `docs/` | Architecture docs | — |

## One-time backend setup (≈10 minutes)

1. Create a free project at [supabase.com](https://supabase.com) (choose the
   Mumbai region for India users).
2. In the Supabase **SQL Editor**, run these files in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/seed.sql` (loads all exams + grammar categories/topics + 2 sample questions)
3. In **Authentication → Users**, create the admin user (email + password),
   then in the SQL editor promote it:
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
   ```
4. Copy the project URL and anon/publishable key from
   **Project Settings → API** into:
   - `admin/.env.local` (copy from `admin/.env.local.example`)
   - `app/src/lib/env.ts`

## Run the admin panel

```bash
cd admin
npm install
npm run dev        # http://localhost:3000 → sign in with the admin user
```

## Run the mobile app (Expo)

```bash
cd app
npm install
npx expo start     # scan the QR with the Expo Go app on your phone
```

Until `app/src/lib/env.ts` has real Supabase keys, the app runs on bundled
sample questions so the UI is fully explorable offline.

Note: the app deliberately has **no login screen** — students land directly on
the home tabs. Sign-in will be added later only as an optional step for
premium/sync.

## Current status

- ✅ Database schema with RLS security, bilingual fields, seed taxonomy
- ✅ Admin panel: login (admin-only), dashboard stats, question add/edit/delete
  with filters; placeholders for tests/PDFs/videos/notes/users/reports
- ✅ App: brand theme, EN/ગુજ toggle, grammar & exam browsing, quiz engine
  (50/100/200/random/unlimited) with instant feedback, explanations, results
  & review — no forced login
- ⬜ Next: attempt tracking → performance analysis, mock tests,
  PDFs/videos/notes screens, AdMob, Play Billing premium, push notifications,
  bulk question import in admin
