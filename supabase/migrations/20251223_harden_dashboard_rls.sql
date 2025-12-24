-- ============================================================================
-- Afrikoni - HARD RLS for dashboard-owned tables
-- Date: 2025-12-23
--
-- Goal:
--   - Enforce strict company-based isolation using public.current_company_id()
--   - Remove ALL existing policies on key tables and recreate minimal, safe ones
--   - Cover SELECT / INSERT / UPDATE / DELETE for:
--       products, rfqs, orders, invoices, escrow_payments, escrow_events, reviews
-- ============================================================================

-- Ensure current_company_id() exists and returns the company for auth.uid()
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

-- Helper: drop all policies on a given table
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('products', 'rfqs', 'orders', 'invoices', 'escrow_payments', 'escrow_events', 'reviews')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end
$$;

-- PRODUCTS -------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'products'
  ) then
    alter table public.products enable row level security;

    create policy products_select
    on public.products
    for select
    using (company_id = public.current_company_id());

    create policy products_insert
    on public.products
    for insert
    with check (company_id = public.current_company_id());

    create policy products_update
    on public.products
    for update
    using (company_id = public.current_company_id())
    with check (company_id = public.current_company_id());

    create policy products_delete
    on public.products
    for delete
    using (company_id = public.current_company_id());
  end if;
end
$$;

-- RFQS -----------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'rfqs'
  ) then
    alter table public.rfqs enable row level security;

    create policy rfqs_select
    on public.rfqs
    for select
    using (
      buyer_company_id = public.current_company_id()
      or company_id = public.current_company_id()
    );

    create policy rfqs_insert
    on public.rfqs
    for insert
    with check (
      buyer_company_id = public.current_company_id()
      or company_id = public.current_company_id()
    );

    create policy rfqs_update
    on public.rfqs
    for update
    using (
      buyer_company_id = public.current_company_id()
      or company_id = public.current_company_id()
    )
    with check (
      buyer_company_id = public.current_company_id()
      or company_id = public.current_company_id()
    );

    create policy rfqs_delete
    on public.rfqs
    for delete
    using (
      buyer_company_id = public.current_company_id()
      or company_id = public.current_company_id()
    );
  end if;
end
$$;

-- ORDERS ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'orders'
  ) then
    alter table public.orders enable row level security;

    create policy orders_select
    on public.orders
    for select
    using (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );

    create policy orders_insert
    on public.orders
    for insert
    with check (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );

    create policy orders_update
    on public.orders
    for update
    using (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    )
    with check (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );

    create policy orders_delete
    on public.orders
    for delete
    using (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );
  end if;
end
$$;

-- INVOICES -------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'invoices'
  ) then
    alter table public.invoices enable row level security;

    create policy invoices_select
    on public.invoices
    for select
    using (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );

    create policy invoices_insert
    on public.invoices
    for insert
    with check (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );

    create policy invoices_update
    on public.invoices
    for update
    using (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    )
    with check (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );

    create policy invoices_delete
    on public.invoices
    for delete
    using (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );
  end if;
end
$$;

-- ESCROW PAYMENTS & EVENTS ---------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'escrow_payments'
  ) then
    alter table public.escrow_payments enable row level security;

    create policy escrow_payments_select
    on public.escrow_payments
    for select
    using (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );

    create policy escrow_payments_update
    on public.escrow_payments
    for update
    using (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    )
    with check (
      buyer_company_id = public.current_company_id()
      or seller_company_id = public.current_company_id()
    );
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'escrow_events'
  ) then
    alter table public.escrow_events enable row level security;

    create policy escrow_events_select
    on public.escrow_events
    for select
    using (
      exists (
        select 1
        from public.escrow_payments ep
        where ep.id = escrow_events.escrow_id
          and (
            ep.buyer_company_id = public.current_company_id()
            or ep.seller_company_id = public.current_company_id()
          )
      )
    );
  end if;
end
$$;

-- REVIEWS --------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'reviews'
  ) then
    alter table public.reviews enable row level security;

    create policy reviews_select
    on public.reviews
    for select
    using (
      buyer_company_id = public.current_company_id()
      or reviewed_company_id = public.current_company_id()
    );

    create policy reviews_insert
    on public.reviews
    for insert
    with check (
      buyer_company_id = public.current_company_id()
    );
  end if;
end
$$;


