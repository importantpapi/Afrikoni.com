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

  // Set content type header via meta tag (for SEO crawlers)
  useEffect(() => {
    // For React Router, we return XML as text
    // The server/Vercel should handle content-type headers
    if (sitemap) {
      // Create a blob and download approach for proper XML rendering
      const blob = new Blob([sitemap], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      // Note: In production, Vercel will serve this with proper content-type
    }
  }, [sitemap]);

  // Return XML content as plain text (browsers will render as XML)
  // For proper XML rendering, this should be served as application/xml by the server
  return (
    <pre style={{ 
      whiteSpace: 'pre-wrap', 
      fontFamily: 'monospace',
      margin: 0,
      padding: '20px',
      backgroundColor: '#fff',
      color: '#000'
    }}>
      {sitemap || 'Loading sitemap...'}
    </pre>
  );
}

