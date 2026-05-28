-- Admin support schema for the LMS admin dashboard

alter table if exists public.users
  add column if not exists account_status text not null default 'active',
  add column if not exists teacher_verified boolean not null default false,
  add column if not exists verified_at timestamptz;

create table if not exists public.majors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  setting_key text primary key,
  setting_value text,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists majors_set_updated_at on public.majors;
create trigger majors_set_updated_at
before update on public.majors
for each row execute function public.set_updated_at();

drop trigger if exists semesters_set_updated_at on public.semesters;
create trigger semesters_set_updated_at
before update on public.semesters
for each row execute function public.set_updated_at();

drop trigger if exists system_settings_set_updated_at on public.system_settings;
create trigger system_settings_set_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

insert into public.system_settings (setting_key, setting_value)
values
  ('registration_open', 'true'),
  ('teacher_approval_required', 'true'),
  ('semester_in_progress', 'false')
on conflict (setting_key) do nothing;

-- Optional RLS policies for future Supabase-native access:
-- alter table public.majors enable row level security;
-- create policy "Admins manage majors" on public.majors
--   for all using ((auth.jwt() ->> 'role') = 'admin')
--   with check ((auth.jwt() ->> 'role') = 'admin');
-- alter table public.semesters enable row level security;
-- create policy "Admins manage semesters" on public.semesters
--   for all using ((auth.jwt() ->> 'role') = 'admin')
--   with check ((auth.jwt() ->> 'role') = 'admin');
-- alter table public.system_settings enable row level security;
-- create policy "Admins manage settings" on public.system_settings
--   for all using ((auth.jwt() ->> 'role') = 'admin')
--   with check ((auth.jwt() ->> 'role') = 'admin');