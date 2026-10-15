-- ─── Zed Platform – Module Interest Registry ──────────────────────────────────
-- Migration: 0004_module_interest.sql
--
-- Records user interest in coming-soon modules.
-- This table is NOT automatically populated; client code calls an
-- INSERT IGNORE (ON CONFLICT DO NOTHING) when a user clicks "Notify me".
--
-- DO NOT run this migration automatically — apply it manually via
-- the Supabase dashboard SQL editor or `supabase db push`.

create table if not exists public.module_interest (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  module_slug text not null,
  created_at  timestamptz not null default now(),

  -- Each user can register interest in a module exactly once.
  constraint unique_user_module unique (user_id, module_slug)
);

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table public.module_interest enable row level security;

-- Users can only insert their own interest rows.
drop policy if exists "insert_own_interest" on public.module_interest;
create policy "insert_own_interest"
  on public.module_interest
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can only read their own interest rows.
drop policy if exists "select_own_interest" on public.module_interest;
create policy "select_own_interest"
  on public.module_interest
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can delete (withdraw) their own interest rows.
drop policy if exists "delete_own_interest" on public.module_interest;
create policy "delete_own_interest"
  on public.module_interest
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Admins can read all interest rows for analytics.
drop policy if exists "admin_read_all_interest" on public.module_interest;
create policy "admin_read_all_interest"
  on public.module_interest
  for select
  to authenticated
  using (public.is_admin());

-- ── Index ─────────────────────────────────────────────────────────────────────

create index if not exists module_interest_slug_idx
  on public.module_interest (module_slug);
