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
alter table public.logistics_quotes enable row level security;

create policy "logistics_quotes"
on public.logistics_quotes
for select using (logistics_partner_id = public.current_company_id());

create policy "buyer_quotes"
on public.logistics_quotes
for select using (
  exists (
    select 1 from public.orders o
    where o.id = logistics_quotes.order_id
      and o.buyer_company_id = public.current_company_id()
  )
);

-- PLATFORM REVENUE
alter table public.platform_revenue enable row level security;

create policy "admin_revenue"
on public.platform_revenue
for select using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "logistics_revenue"
on public.platform_revenue
for select using (
  logistics_partner_id = public.current_company_id()
);


