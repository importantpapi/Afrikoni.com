// SEO component - using document.title for now (can add react-helmet-async later)

import { useEffect } from 'react';

/**
 * SEO component for managing page meta tags
 * Uses document manipulation for now (can upgrade to react-helmet-async later)
 */
export default function SEO({
  title = 'AFRIKONI - African B2B Marketplace',
  description = 'Connect with verified African suppliers and buyers. Source products, post RFQs, and grow your business across Africa.',
  image = '/og-image.jpg',
  url = '',
  type = 'website',
  ogType = 'website',
  ogImage = '/og-image.jpg',
  structuredData = null
}) {
  const fullTitle = title?.includes('AFRIKONI') ? title : `${title} | AFRIKONI`;
  const fullUrl = url ? `https://afrikoni.com${url}` : 'https://afrikoni.com';
  const fullImage = image.startsWith('http') ? image : `https://afrikoni.com${image}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Primary Meta Tags
    updateMetaTag('description', description);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('author', 'AFRIKONI');

    // Open Graph
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImage, true);
    updateMetaTag('og:site_name', 'AFRIKONI', true);

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', fullUrl);
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', fullImage);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Structured Data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-seo', 'true');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [fullTitle, description, fullImage, fullUrl, type, structuredData]);

  return null;
}

