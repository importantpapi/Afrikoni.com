-- RLS policies for dashboard universes (buyer, seller, logistics, admin)

-- ORDERS
alter table public.orders enable row level security;

create policy "buyer_orders"
on public.orders
for select using (buyer_company_id = public.current_company_id());

create policy "seller_orders"
on public.orders
for select using (seller_company_id = public.current_company_id());

create policy "admin_orders"
on public.orders
for select using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- RFQS
alter table public.rfqs enable row level security;

create policy "buyer_rfqs"
on public.rfqs
for select using (buyer_company_id = public.current_company_id());

-- SHIPMENTS
alter table public.shipments enable row level security;

create policy "logistics_shipments"
on public.shipments
for select using (logistics_partner_id = public.current_company_id());

create policy "buyer_shipments"
on public.shipments
for select using (
  exists (
    select 1 from public.orders o
    where o.id = shipments.order_id
      and o.buyer_company_id = public.current_company_id()
  )
);

create policy "seller_shipments"
on public.shipments
for select using (
  exists (
    select 1 from public.orders o
    where o.id = shipments.order_id
      and o.seller_company_id = public.current_company_id()
  )
);

-- LOGISTICS QUOTES
do $$
begin
  -- Only apply RLS and policies if the logistics_quotes table exists
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'logistics_quotes'
  ) then

    alter table public.logistics_quotes enable row level security;

    -- Logistics partner can see their own quotes
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'logistics_quotes'
        and policyname = 'logistics_quotes'
    ) then
      create policy "logistics_quotes"
      on public.logistics_quotes
      for select using (logistics_partner_id = public.current_company_id());
    end if;

    -- Buyers can see quotes linked to their orders
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'logistics_quotes'
        and policyname = 'buyer_quotes'
    ) then
      create policy "buyer_quotes"
      on public.logistics_quotes
      for select using (
        exists (
          select 1 from public.orders o
          where o.id = logistics_quotes.order_id
            and o.buyer_company_id = public.current_company_id()
        )
      );
    end if;

  end if;
end
$$;

-- PLATFORM REVENUE
do $$
begin
  -- Only apply RLS and policies if the platform_revenue table exists
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'platform_revenue'
  ) then

    alter table public.platform_revenue enable row level security;

    -- Admins can see all platform revenue
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'platform_revenue'
        and policyname = 'admin_revenue'
    ) then
      create policy "admin_revenue"
      on public.platform_revenue
      for select using (
        exists (
          select 1 from public.profiles
          where id = auth.uid() and role = 'admin'
        )
      );
    end if;

    -- Logistics partners can see revenue related to them
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'platform_revenue'
        and policyname = 'logistics_revenue'
    ) then
      create policy "logistics_revenue"
      on public.platform_revenue
      for select using (
        logistics_partner_id = public.current_company_id()
      );
    end if;

  end if;
end
$$;

