-- English Winglish — initial schema
-- Bilingual content convention: *_en (English) and *_gu (Gujarati, nullable).

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────
create type user_role as enum ('student', 'admin');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'student',
  is_premium boolean not null default false,
  premium_until timestamptz,
  fcm_token text,
  language_pref text not null default 'en', -- 'en' | 'gu'
  created_at timestamptz not null default now()
);

-- auto-create profile on signup
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ─────────────────────────────────────────────
-- Content taxonomy
-- ─────────────────────────────────────────────
create table exams (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'gpsc', 'ssc-cgl'
  name_en text not null,
  name_gu text,
  icon text,                          -- asset/emoji key for app UI
  sort_order int not null default 0,
  is_active boolean not null default true
);

create type category_kind as enum ('grammar', 'vocabulary');

create table categories (
  id uuid primary key default gen_random_uuid(),
  kind category_kind not null default 'grammar',
  name_en text not null,
  name_gu text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories on delete cascade,
  name_en text not null,
  name_gu text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ─────────────────────────────────────────────
-- Questions
-- ─────────────────────────────────────────────
create type difficulty as enum ('easy', 'medium', 'hard');

create table questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics on delete set null,   -- grammar practice section
  exam_id uuid references exams on delete set null,     -- PYQ section
  year int,                                             -- PYQ year, e.g. 2022
  question_en text not null,
  question_gu text,
  options_en text[] not null check (array_length(options_en, 1) = 4),
  options_gu text[],
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation_en text,
  explanation_gu text,
  difficulty difficulty not null default 'medium',
  is_premium boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (topic_id is not null or exam_id is not null)
);

create index idx_questions_topic on questions (topic_id) where is_active;
create index idx_questions_exam_year on questions (exam_id, year) where is_active;

-- ─────────────────────────────────────────────
-- Mock tests
-- ─────────────────────────────────────────────
create table tests (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_gu text,
  exam_id uuid references exams on delete set null,
  duration_minutes int not null default 60,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table test_questions (
  test_id uuid not null references tests on delete cascade,
  question_id uuid not null references questions on delete cascade,
  sort_order int not null default 0,
  primary key (test_id, question_id)
);

-- ─────────────────────────────────────────────
-- Attempts (powers performance analysis)
-- ─────────────────────────────────────────────
create type attempt_mode as enum ('practice', 'mock', 'random');

create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  mode attempt_mode not null,
  test_id uuid references tests on delete set null,
  topic_id uuid references topics on delete set null,
  exam_id uuid references exams on delete set null,
  total int not null default 0,
  correct int not null default 0,
  wrong int not null default 0,
  skipped int not null default 0,
  duration_seconds int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_attempts_user on attempts (user_id, started_at desc);

create table attempt_answers (
  attempt_id uuid not null references attempts on delete cascade,
  question_id uuid not null references questions on delete cascade,
  selected_index smallint,             -- null = skipped
  is_correct boolean not null default false,
  time_taken_seconds int,
  primary key (attempt_id, question_id)
);

-- ─────────────────────────────────────────────
-- Study material
-- ─────────────────────────────────────────────
create table pdfs (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_gu text,
  topic_id uuid references topics on delete set null,
  exam_id uuid references exams on delete set null,
  storage_path text not null,          -- Supabase Storage object path
  is_premium boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table videos (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_gu text,
  topic_id uuid references topics on delete set null,
  exam_id uuid references exams on delete set null,
  youtube_id text not null,
  is_premium boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_gu text,
  topic_id uuid references topics on delete set null,
  body_md text not null default '',    -- markdown content
  is_premium boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Subscriptions (Google Play Billing)
-- ─────────────────────────────────────────────
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  platform text not null default 'play',
  product_id text not null,            -- e.g. premium_monthly
  purchase_token text unique not null,
  status text not null default 'pending', -- pending | active | expired | cancelled
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user on subscriptions (user_id);

-- ─────────────────────────────────────────────
-- Question error reports
-- ─────────────────────────────────────────────
create table question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  message text not null,
  status text not null default 'open', -- open | resolved | rejected
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────
alter table profiles enable row level security;
alter table exams enable row level security;
alter table categories enable row level security;
alter table topics enable row level security;
alter table questions enable row level security;
alter table tests enable row level security;
alter table test_questions enable row level security;
alter table attempts enable row level security;
alter table attempt_answers enable row level security;
alter table pdfs enable row level security;
alter table videos enable row level security;
alter table notes enable row level security;
alter table subscriptions enable row level security;
alter table question_reports enable row level security;

-- profiles: user sees/updates own row; admin sees all
create policy "own profile read" on profiles for select using (id = auth.uid() or is_admin());
create policy "own profile update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'student'); -- users cannot self-promote
create policy "admin profile update" on profiles for update using (is_admin());

-- content tables: any signed-in user reads active rows; admin full access
create policy "read active" on exams for select using (is_active or is_admin());
create policy "admin write" on exams for all using (is_admin());
create policy "read active" on categories for select using (is_active or is_admin());
create policy "admin write" on categories for all using (is_admin());
create policy "read active" on topics for select using (is_active or is_admin());
create policy "admin write" on topics for all using (is_admin());
create policy "read active" on questions for select using (is_active or is_admin());
create policy "admin write" on questions for all using (is_admin());
create policy "read active" on tests for select using (is_active or is_admin());
create policy "admin write" on tests for all using (is_admin());
create policy "read" on test_questions for select using (true);
create policy "admin write" on test_questions for all using (is_admin());
create policy "read active" on pdfs for select using (is_active or is_admin());
create policy "admin write" on pdfs for all using (is_admin());
create policy "read active" on videos for select using (is_active or is_admin());
create policy "admin write" on videos for all using (is_admin());
create policy "read active" on notes for select using (is_active or is_admin());
create policy "admin write" on notes for all using (is_admin());

-- attempts: users own their rows; admin reads for reports
create policy "own attempts" on attempts for all using (user_id = auth.uid());
create policy "admin read attempts" on attempts for select using (is_admin());
create policy "own answers" on attempt_answers for all
  using (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()));
create policy "admin read answers" on attempt_answers for select using (is_admin());

-- subscriptions: user reads own; only service role (edge function) writes
create policy "own subscriptions read" on subscriptions for select
  using (user_id = auth.uid() or is_admin());

-- reports: user creates + reads own; admin manages
create policy "create report" on question_reports for insert with check (user_id = auth.uid());
create policy "own reports read" on question_reports for select using (user_id = auth.uid() or is_admin());
create policy "admin manage reports" on question_reports for update using (is_admin());
