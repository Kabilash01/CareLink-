-- ============================================================
-- CareLink — Test Reports Storage Feature
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Test reports table
create table if not exists test_reports (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,                          -- e.g. "Complete Blood Count"
  lab_name        text,                                   -- optional
  test_date       date,                                   -- optional
  report_type     text,                                   -- 'Blood', 'Imaging', 'Urine', etc.
  file_url        text,                                   -- Supabase Storage public URL
  file_type       text,                                   -- 'pdf', 'image'
  file_size       text,                                   -- '2.4 MB'
  notes           text,                                   -- optional notes
  status          text default 'normal',                  -- 'normal', 'abnormal', 'borderline'
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table test_reports enable row level security;

create policy "Users see own test reports"
  on test_reports for select
  using (auth.uid() = user_id);

create policy "Users insert own test reports"
  on test_reports for insert
  with check (auth.uid() = user_id);

create policy "Users update own test reports"
  on test_reports for update
  using (auth.uid() = user_id);

create policy "Users delete own test reports"
  on test_reports for delete
  using (auth.uid() = user_id);

-- Index
create index if not exists idx_test_reports_user
  on test_reports(user_id, created_at desc);

-- 2. Storage bucket for test reports
insert into storage.buckets (id, name, public)
values ('test-reports', 'test-reports', true)
on conflict (id) do nothing;

create policy "Users upload own test reports"
  on storage.objects for insert
  with check (
    bucket_id = 'test-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own test reports"
  on storage.objects for update
  using (
    bucket_id = 'test-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own test reports"
  on storage.objects for delete
  using (
    bucket_id = 'test-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Public read test reports"
  on storage.objects for select
  using (bucket_id = 'test-reports');
