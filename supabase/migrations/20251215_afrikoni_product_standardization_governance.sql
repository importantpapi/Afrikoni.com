-- Afrikoni product standardization governance (unbreakable backend layer)
-- Date: 2025-12-15

-- 0. Defensive schema alignment (no-op if columns already exist)
alter table public.products
  add column if not exists is_standardized boolean not null default false;

alter table public.products
  add column if not exists completeness_score integer not null default 0;

-- If images is not jsonb yet, you can manually align it; here we assume it already exists.

-- 1. Helper: determine app-level role from JWT (e.g. 'supplier', 'admin')
create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif( (current_setting('request.jwt.claims', true)::jsonb ->> 'app_role'), '' ),
    current_setting('role', true)
  );
$$;

-- 2. Ensure RLS is enabled on products
alter table public.products enable row level security;

-- 3. SELECT policies

-- 3.1 Public can read active products (adjust status logic if needed)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'public_read_active_products'
  ) then
    create policy "public_read_active_products"
      on public.products
      for select
      using (status = 'active');
  end if;
end
$$;

-- 3.2 Suppliers can read their own products (any status)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'supplier_read_own_products'
  ) then
    create policy "supplier_read_own_products"
      on public.products
      for select
      to authenticated
      using (supplier_id = auth.uid());
  end if;
end
$$;

-- 4. UPDATE policies

-- 4.1 Supplier can update own products (field-level protection is via trigger)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'supplier_update_own_products'
  ) then
    create policy "supplier_update_own_products"
      on public.products
      for update
      to authenticated
      using (supplier_id = auth.uid())
      with check (supplier_id = auth.uid());
  end if;
end
$$;

-- 4.2 Admin full update
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'admin_full_update_products'
  ) then
    create policy "admin_full_update_products"
      on public.products
      for update
      using (public.current_app_role() = 'admin')
      with check (public.current_app_role() = 'admin');
  end if;
end
$$;

-- 4.3 Service role full update (governed AI / backend)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'service_full_update_products'
  ) then
    create policy "service_full_update_products"
      on public.products
      for update
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

-- 5. BEFORE UPDATE trigger: lock description on standardized products

create or replace function public.enforce_standardized_description_lock()
returns trigger
language plpgsql
as $$
declare
  app_role text := public.current_app_role();
  pg_role text := current_user;
begin
  -- Only apply on UPDATE
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  -- If not standardized, nothing to enforce here
  if coalesce(old.is_standardized, false) = false then
    return new;
  end if;

  -- If description is not changing, allow
  if new.description is not distinct from old.description then
    return new;
  end if;

  -- Privileged callers:
  -- - Admin (app_role = 'admin')
  -- - service_role (backend / governed AI)
  if app_role = 'admin' then
    return new;
  end if;

  if pg_role = 'service_role' then
    return new;
  end if;

  -- Everyone else (including suppliers) is blocked from changing description
  raise exception
    'Description is locked by Afrikoni to protect buyers and platform trust.'
    using hint = 'Update factual fields (price, MOQ, specs, packaging) instead. Description can only be updated by Afrikoni AI or admins.';
end;
$$;

drop trigger if exists trg_enforce_standardized_description_lock on public.products;

create trigger trg_enforce_standardized_description_lock
before update on public.products
for each row
execute function public.enforce_standardized_description_lock();

-- 6. (Optional but recommended) server-side completeness_score

create or replace function public.recompute_product_completeness()
returns trigger
language plpgsql
as $$
declare
  score int := 0;
begin
  if new.description is not null and length(trim(new.description)) > 100 then
    score := score + 25;
  end if;

  -- adjust if images column is json/jsonb/array; here we assume jsonb
  begin
    if new.images is not null and jsonb_typeof(new.images::jsonb) = 'array'
       and jsonb_array_length(new.images::jsonb) > 0 then
      score := score + 25;
    end if;
  exception when others then
    -- ignore shape issues; do not block writes
  end;

  if new.min_order_quantity is not null and new.min_order_quantity > 0 then
    score := score + 15;
  end if;

  if (new.price_min is not null or new.price_max is not null) then
    score := score + 15;
  end if;

  begin
    if new.specifications is not null
       and jsonb_object_length(new.specifications::jsonb) > 0 then
      score := score + 10;
    end if;
  exception when others then
    -- ignore shape issues
  end;

  if new.certifications is not null and array_length(new.certifications, 1) > 0 then
    score := score + 10;
  end if;

  new.completeness_score := least(score, 100);
  return new;
end;
$$;

drop trigger if exists trg_recompute_product_completeness on public.products;

create trigger trg_recompute_product_completeness
before insert or update on public.products
for each row
execute function public.recompute_product_completeness();


