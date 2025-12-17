-- ============================================================================
-- Afrikoni - Fix function search_path for security (linter 0011)
-- Date: 2025-12-17
--
-- Goal:
--   - Make key public functions have an immutable, safe search_path.
--   - Address Supabase "function_search_path_mutable" warnings.
--   - Keep behavior identical; only adjust search_path metadata.
--
-- Notes:
--   - Uses ALTER FUNCTION IF EXISTS for idempotency and safety.
--   - Assumes these functions are defined in schema "public" with no arguments.
--   - No functions are dropped or redefined; only search_path is set.
-- ============================================================================

-- Prefer a minimal, explicit search_path: public only.
-- If you later introduce other schemas, update this list deliberately.

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'update_company_team_updated_at'
      and p.pronargs = 0
  ) then
    alter function public.update_company_team_updated_at()
      set search_path = public;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'current_company_id'
      and p.pronargs = 0
  ) then
    alter function public.current_company_id()
      set search_path = public;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'current_app_role'
      and p.pronargs = 0
  ) then
    alter function public.current_app_role()
      set search_path = public;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'enforce_standardized_description_lock'
      and p.pronargs = 0
  ) then
    alter function public.enforce_standardized_description_lock()
      set search_path = public;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'recompute_product_completeness'
      and p.pronargs = 0
  ) then
    alter function public.recompute_product_completeness()
      set search_path = public;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'update_updated_at_column'
      and p.pronargs = 0
  ) then
    alter function public.update_updated_at_column()
      set search_path = public;
  end if;
end $$;


