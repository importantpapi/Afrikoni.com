/**
 * Sitemap.xml page
 * This generates a dynamic sitemap for SEO
 * 
 * Note: For production, consider generating this as a static file during build
 * or using a server-side API endpoint
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { generateSitemap } from '@/utils/generateSitemap';

export default function SitemapXML() {
  const [sitemap, setSitemap] = useState('');

  useEffect(() => {
    const loadSitemap = async () => {
      try {
        // Fetch products, categories, and suppliers
        const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, slug, created_at, updated_at')
            .eq('status', 'active')
            .limit(1000),
          supabase
            .from('categories')
            .select('id, slug, created_at, updated_at')
            .limit(100),
          supabase
            .from('companies')
            .select('id, slug, created_at, updated_at')
            .eq('verification_status', 'verified')
            .limit(500)
        ]);

        const products = productsRes.data || [];
        const categories = categoriesRes.data || [];
        const suppliers = suppliersRes.data || [];

        const xml = generateSitemap(products, categories, suppliers);
        setSitemap(xml);
      } catch (error) {
        console.error('Error generating sitemap:', error);
        // Fallback to static sitemap
        setSitemap(generateSitemap());
      }
    };

    loadSitemap();
  }, []);

  // Return XML content
  return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{sitemap}</pre>;
}

