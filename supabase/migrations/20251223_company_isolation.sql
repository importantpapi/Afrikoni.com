-- ============================================================================
-- Afrikoni - Company Isolation & Auth User Bootstrap
-- Date: 2025-12-23
--
-- Goal:
--   - Guarantee each new auth user receives a UNIQUE company_id
--   - Prevent frontend from ever setting company_id directly
--   - Make database the single source of truth for user → company mapping
-- ============================================================================

-- Ensure companies table exists (minimal definition if missing)
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  company_name text,
  created_at timestamptz default now()
);

-- Ensure profiles table has company_id column (nullable for legacy rows)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'company_id'
  ) then
    alter table public.profiles
      add column company_id uuid references public.companies(id);
  end if;
end
$$;

-- =====================================================================
-- handle_new_user trigger function
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  new_company_id uuid;
  user_role text;
begin
  -- Default role if not provided in auth metadata
  user_role := coalesce(new.raw_user_meta_data->>'role', 'buyer');

  -- Create a fresh company for every new auth user
  insert into public.companies (company_name)
  values (coalesce(new.raw_user_meta_data->>'full_name', new.email) || ' Company')
  returning id into new_company_id;

  -- Upsert profile and attach the new company_id
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    company_id
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    user_role,
    new_company_id
  )
  on conflict (id)
  do update set company_id = excluded.company_id;

  return new;
end;
$$;

-- Attach trigger to auth.users so every new user is assigned a unique company
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();


