/**
 * Trending Products Section Component
 * Phase 2.2 - Shows 8-12 trending products
 * Sorted by: views, recent orders, verified suppliers
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/api/supabaseClient';
import ProductCard from '@/components/products/ProductCard';

export default function TrendingProductsSection() {
  const navigate = useNavigate();
  const { language = 'en' } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingProducts();
  }, []);

  const loadTrendingProducts = async () => {
    try {
      setLoading(true);

      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      // Simplified query - PostgREST friendly (no complex joins)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, description, price_min, price_max, currency, status, company_id, category_id, country_of_origin, views, created_at, images, product_images(url, is_primary)')
        .eq('status', 'active')
        .order('views', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);

      if (productsError) throw productsError;

      // Load companies separately if needed
      let companiesMap = new Map();
      if (productsData && productsData.length > 0) {
        const companyIds = [...new Set(productsData.map(p => p.company_id).filter(Boolean))];
        if (companyIds.length > 0) {
          try {
            const { data: companies } = await supabase
              .from('companies')
              .select('id, company_name, verification_status, country')
              .in('id', companyIds);

            if (companies) {
              companies.forEach(c => companiesMap.set(c.id, c));
            }
          } catch (err) {
            console.warn('Error loading companies for trending products:', err);
            // Continue without company data
          }
        }
      }

      // Merge company data with products
      const productsWithCompanies = (productsData || []).map(product => ({
        ...product,
        companies: companiesMap.get(product.company_id) || null
      }));

      // Sort: verified suppliers first, then by views
      const sorted = productsWithCompanies.sort((a, b) => {
        const aVerified = a.companies?.verification_status === 'verified' ? 1 : 0;
        const bVerified = b.companies?.verification_status === 'verified' ? 1 : 0;
        if (aVerified !== bVerified) return bVerified - aVerified;
        return (b.views || 0) - (a.views || 0);
      });

      setProducts(sorted);
    } catch (err) {
      console.error('Error loading trending products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-os-xl md:text-os-2xl font-bold text-afrikoni-chestnut flex items-center gap-2">
              📈 Trending Products
            </h2>
            <button
              onClick={() => navigate(`/${language}/marketplace`)}
              className="text-os-sm md:text-os-base text-os-accent font-medium hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border border-os-accent/10 bg-white rounded-lg animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-12 bg-white">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-os-xl md:text-os-2xl font-bold text-afrikoni-chestnut flex items-center gap-2">
            📈 Trending Products
          </h2>
          <button
            onClick={() => navigate(`/${language}/marketplace`)}
            className="text-os-sm md:text-os-base text-os-accent font-medium hover:underline"
          >
            View All →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={idx < 4} // Load first 4 images immediately
            />
          ))}
        </div>
      </div>
    </section>
  );
}


