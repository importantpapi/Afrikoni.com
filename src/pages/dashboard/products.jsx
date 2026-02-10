import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import {
  Plus,
  Search,
  Filter,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Package,
  ArrowUpDown,
  Grid3X3,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { cn } from '@/lib/utils';
import { TableSkeleton, CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import EmptyState from '@/components/shared/ui/EmptyState';

const statusConfig = {
  active: { label: 'Active', icon: CheckCircle2 },
  pending_review: { label: 'Pending', icon: Clock },
  draft: { label: 'Draft', icon: AlertCircle },
  paused: { label: 'Paused', icon: Pause },
  rejected: { label: 'Rejected', icon: AlertCircle },
};

export default function Products() {
  const navigate = useNavigate();
  const { profileCompanyId } = useDashboardKernel();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');

  // ✅ Data Loader: Fetch products from real DB
  const loadProducts = useCallback(async () => {
    if (!profileCompanyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', profileCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (err) {
      console.error('[Products] Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [profileCompanyId]);

  // ✅ Effect: Fetch on mount or company change
  useEffect(() => {
    if (profileCompanyId) {
      loadProducts();
    }
  }, [profileCompanyId, loadProducts]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const term = search.toLowerCase();
      return (
        product.name?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
      );
    });
  }, [search, products]);

  // Loading State
  if (isLoading) {
    return (
      <div className="os-page os-stagger space-y-6">
        <Surface variant="glass" className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="flex gap-4">
            <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </Surface>
        {view === 'list' ? <TableSkeleton rows={5} columns={6} /> : <CardSkeleton count={6} />}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="os-page p-6">
        <ErrorState
          title="Couldn't load products"
          message={error}
          onRetry={loadProducts}
        />
      </div>
    );
  }

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="os-label">Trade OS Catalog</div>
            <h1 className="os-title mt-2">Products</h1>
            <p className="text-sm text-os-muted">
              {products.length} products in your catalog
            </p>
          </div>
          <Button
            className="bg-[var(--os-text-primary)] text-[var(--os-bg)] hover:opacity-90 font-semibold"
            onClick={() => navigate('/dashboard/products/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-os-muted" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <div className="flex items-center bg-os-surface-1 rounded-lg p-0.5 border border-os-stroke">
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-1.5 rounded-md',
                view === 'list' && 'bg-os-surface-0'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={cn(
                'p-1.5 rounded-md',
                view === 'grid' && 'bg-os-surface-0'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Surface>

      {/* Empty State */}
      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Get started by adding your first product to the catalog."
          cta="Add Product"
          ctaAction={() => navigate('/dashboard/products/new')}
          icon={Package}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching products"
          description="Try adjusting your search or filters."
          icon={Search}
        />
      ) : view === 'list' ? (
        <Surface variant="panel" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-os-stroke bg-os-surface-1">
                  {['Product', 'Category', 'Price', 'MOQ', 'Status', 'Views', 'Inquiries', ''].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.25em] text-os-muted"
                      >
                        {header && (
                          <span className="flex items-center gap-1">
                            {header}
                            {header !== '' && (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </span>
                        )}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-os-stroke">
                {filtered.map((product) => {
                  const status = statusConfig[product.status] || statusConfig.draft;
                  // Handle potential missing fields gracefully
                  const price = product.price_per_unit || product.pricePerUnit || 0;
                  const unit = product.unit || 'units';
                  const moq = product.min_order_quantity || product.minOrderQuantity || 0;
                  const origin = product.origin_country || product.originCountry || 'Unknown';
                  const hsCode = product.hs_code || product.hsCode || '---';
                  const views = product.views || 0;
                  const inquiries = product.inquiries || 0;
                  const category = product.category || 'Uncategorized';

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-os-surface-1 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-os-surface-1 flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-os-muted" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--os-text-primary)]">
                              {product.name}
                            </p>
                            <p className="text-xs text-os-muted">
                              {origin} · HS {hsCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold tabular-nums">
                          ${Number(price).toLocaleString()}
                        </span>
                        <span className="text-xs text-os-muted">/{unit}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-os-muted tabular-nums">
                        {Number(moq).toLocaleString()} {unit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <status.icon className="h-3 w-3 text-os-muted" />
                          <StatusBadge label={status.label} tone="neutral" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-sm text-os-muted tabular-nums">
                          <Eye className="h-3 w-3" /> {views.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-sm text-os-muted tabular-nums">
                          <MessageSquare className="h-3 w-3" /> {inquiries}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 rounded-lg hover:bg-os-surface-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4 text-os-muted" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Surface>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const status = statusConfig[product.status] || statusConfig.draft;
            const price = product.price_per_unit || product.pricePerUnit || 0;
            const unit = product.unit || 'units';
            const moq = product.min_order_quantity || product.minOrderQuantity || 0;
            const origin = product.origin_country || product.originCountry || 'Unknown';
            const hsCode = product.hs_code || product.hsCode || '---';
            const views = product.views || 0;
            const inquiries = product.inquiries || 0;
            const category = product.category || 'Uncategorized';

            return (
              <Surface key={product.id} variant="panel" className="p-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-os-surface-1 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-os-muted" />
                    )}
                  </div>
                  <StatusBadge label={status.label} tone="neutral" />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-[var(--os-text-primary)]">
                    {product.name}
                  </p>
                  <p className="text-xs text-os-muted">
                    {origin} · HS {hsCode}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold tabular-nums">
                    ${Number(price).toLocaleString()}/{unit}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-os-muted">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {inquiries}
                  </span>
                  <span>MOQ {Number(moq).toLocaleString()} {unit}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" size="sm">View</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}
