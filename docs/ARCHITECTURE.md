# English Winglish — Architecture

Commercial MCQ practice app for competitive exams (Gujarat + all-India), by Nikunj Sir.

## Repo layout (monorepo)

```
English_Winglish/
├── app/        React Native (Expo) mobile app — test in Expo Go, build with EAS
├── admin/      Next.js web admin panel
├── supabase/   Database migrations, seed data, edge functions
└── docs/       Architecture & operational docs
```

## Tech stack

| Layer | Technology |
|---|---|
| Mobile app | React Native (Expo) + expo-router; AsyncStorage now, SQLite cache later |
| Backend | Supabase — PostgreSQL, Auth, Storage, Edge Functions |
| Admin panel | Next.js (App Router) + Supabase JS client |
| Push | Firebase Cloud Messaging |
| Ads | Google AdMob (banner, interstitial, rewarded) |
| Payments | Google Play Billing (in-app subscription), verified server-side |
| Analytics | Firebase Analytics + Crashlytics |
| Videos | YouTube unlisted embeds |
| PDFs/Notes | Supabase Storage behind CDN |

## System diagram

```
RN App (Expo) ──(cache: SQLite)──► offline practice
   │
   ▼
Supabase (Postgres + RLS)
   ├── content: exams, categories, topics, questions, tests, pdfs, videos, notes
   ├── users: profiles, attempts, answers, subscriptions
   └── Edge Functions: mock-test builder, Play Billing receipt verify
   ▲
Next.js Admin Panel (admin role)
FCM ──► push notifications
```

## Data model (core)

- `exams` — GPSC, GSSSB, SSC CGL…, bilingual names
- `categories` — grammar groups (Parts of Speech, Tenses…) with `kind` = grammar | vocabulary
- `topics` — belong to a category (Noun, Pronoun… under Parts of Speech)
- `questions` — bilingual question/options/explanation; optional `topic_id` (grammar practice) and optional `exam_id` + `year` (PYQ) so one question can serve both sections; difficulty; `is_premium`
- `tests` + `test_questions` — curated mock tests (50/100/200); random/unlimited practice is generated on the fly from `questions`
- `attempts` + `attempt_answers` — every user answer, powering performance analysis and "unattempted questions" mode
- `pdfs`, `videos`, `notes` — study material, optionally premium-gated
- `subscriptions` — Play Billing purchase records; `profiles.is_premium` derived from active subscription
- `question_reports` — users flag wrong questions; admin resolves

## Security

- Row-Level Security on every table: students read active content + own attempt rows; only `role = 'admin'` can write content.
- Premium PDFs/tests double-gated: RLS checks `is_premium` on the profile (server-side), not just app UI.
- Play Billing receipts verified in an Edge Function before granting premium.

## Monetization

- Free: ads (banner on lists, interstitial after tests, rewarded to unlock one premium mock test).
- Premium (monthly/yearly): no ads, unlimited mock tests, premium PDFs.

## Scale path

Supabase free tier → Pro ($25/mo) as users grow; Postgres indexes on (topic_id), (exam_id, year); content is read-heavy and cached on-device, so DB load stays low. CDN serves PDFs. No re-architecture needed until well past 100k MAU.

## Environments / keys (not committed)

- `admin/.env.local` — NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- `app/lib/env.dart` generated from `app/.env` — SUPABASE_URL, SUPABASE_ANON_KEY, AdMob unit IDs
