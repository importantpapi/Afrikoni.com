create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
as $$
  select company_id
  from public.profiles
  where id = auth.uid();
$$;


