-- ============================================================================
-- Afrikoni - Auth RLS initplan optimization (admin_orders, products policies)
-- Date: 2025-12-16
--
-- Goal:
--   - Satisfy Supabase "auth_rls_initplan" lints by ensuring auth.uid()
--     is wrapped in a SELECT inside RLS policies.
--   - Keep behavior identical; only adjust evaluation pattern.
--
-- STRICT RULES:
--   - No tables are created or dropped.
--   - Only targeted policies are dropped/recreated with the same names.
--   - Migration is safe and idempotent.
-- ============================================================================

-- Optimize admin_orders policy on public.orders
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'orders'
  ) then

    -- Replace existing admin_orders policy with optimized version
    drop policy if exists "admin_orders" on public.orders;

    create policy "admin_orders"
    on public.orders
    for select
    using (
      exists (
        select 1
        from public.profiles
        where id = (select auth.uid()) and role = 'admin'
      )
    );

  end if;
end
$$;

-- Optimize supplier_read_own_products & supplier_update_own_products on public.products
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'products'
  ) then

    -- Read-own policy for suppliers
    drop policy if exists "supplier_read_own_products" on public.products;

    create policy "supplier_read_own_products"
    on public.products
    for select
    to authenticated
    using (supplier_id = (select auth.uid()));

    -- Update-own policy for suppliers
    drop policy if exists "supplier_update_own_products" on public.products;

    create policy "supplier_update_own_products"
    on public.products
    for update
    to authenticated
    using (supplier_id = (select auth.uid()))
    with check (supplier_id = (select auth.uid()));

  end if;
end
$$;


