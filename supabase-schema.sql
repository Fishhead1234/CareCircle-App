-- ==============================================================================
-- CareCircle Family Hub - Supabase Real-Time Family Room Sync Schema
-- Run this script once in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create the care_family_rooms table (keyed by Family Room Code, e.g. 'FAN-FAMILY')
create table if not exists public.care_family_rooms (
  room_code text primary key,
  family_name text not null default 'Family Care Hub',
  ledger_json jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Index on updated_at for fast sync polling
create index if not exists idx_care_family_rooms_updated_at
  on public.care_family_rooms(updated_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.care_family_rooms enable row level security;

-- 4. Allow any family device with the Room Code and Anon Key to read/write the shared ledger
drop policy if exists "Allow anon select care_family_rooms" on public.care_family_rooms;
create policy "Allow anon select care_family_rooms"
  on public.care_family_rooms for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow anon insert care_family_rooms" on public.care_family_rooms;
create policy "Allow anon insert care_family_rooms"
  on public.care_family_rooms for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow anon update care_family_rooms" on public.care_family_rooms;
create policy "Allow anon update care_family_rooms"
  on public.care_family_rooms for update
  to anon, authenticated
  using (true)
  with check (true);

