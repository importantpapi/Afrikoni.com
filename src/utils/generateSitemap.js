/**
 * Generate sitemap.xml for SEO
 * This can be called during build or as an API endpoint
 */

const BASE_URL = 'https://afrikoni.com';

const staticRoutes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/marketplace', priority: 0.9, changefreq: 'daily' },
  { path: '/products', priority: 0.9, changefreq: 'daily' },
  { path: '/rfq', priority: 0.9, changefreq: 'daily' },
  { path: '/suppliers', priority: 0.8, changefreq: 'weekly' },
  { path: '/categories', priority: 0.8, changefreq: 'weekly' },
  { path: '/become-supplier', priority: 0.7, changefreq: 'monthly' },
  { path: '/login', priority: 0.5, changefreq: 'monthly' },
  { path: '/signup', priority: 0.5, changefreq: 'monthly' },
];

export function generateSitemap(products = [], categories = [], suppliers = []) {
  const now = new Date().toISOString();
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static routes
  staticRoutes.forEach(route => {
    sitemap += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
  });

  // Add product pages
  products.forEach(product => {
    if (product.slug) {
      sitemap += `  <url>
    <loc>${BASE_URL}/product/${product.slug}</loc>
    <lastmod>${product.updated_at || product.created_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  });

  // Add category pages
  categories.forEach(category => {
    if (category.slug) {
      sitemap += `  <url>
    <loc>${BASE_URL}/categories/${category.slug}</loc>
    <lastmod>${category.updated_at || category.created_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  });

  // Add supplier pages
  suppliers.forEach(supplier => {
    if (supplier.slug || supplier.id) {
      sitemap += `  <url>
    <loc>${BASE_URL}/supplier/${supplier.slug || supplier.id}</loc>
    <lastmod>${supplier.updated_at || supplier.created_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  });

  sitemap += `</urlset>`;

  return sitemap;
}

/**
 * Generate sitemap as a string (for static generation or API endpoint)
 */
export async function getSitemapXML() {
  // In a real implementation, you'd fetch products, categories, suppliers from Supabase
  // For now, return static sitemap
  return generateSitemap();
}

