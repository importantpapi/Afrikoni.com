import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO component for managing page meta tags
 * Implements 2026 SEO Authority Blueprint:
 * 1. Subdirectory-aware canonicals
 * 2. Hreflang Reciprocity (Handshake)
 * 3. GEO (Generative Engine Optimization) via JSON-LD
 */
export default function SEO({
  title = 'AFRIKONI - African B2B Marketplace',
  description = 'Connect with verified African suppliers and buyers. Source products, post RFQs, and grow your business across Africa.',
  image = '/og-image.jpg',
  url = '',
  type = 'website',
  structuredData = null,
  lang = 'en'
}) {
  const location = useLocation();
  const fullTitle = title?.includes('AFRIKONI') ? title : `${title} | AFRIKONI`;
  const domain = 'https://afrikoni.com';

  // URL logic: Ensure subdirectories are used (2026 Juice Concentration)
  const currentPath = url || location.pathname;
  const cleanPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
  const fullUrl = `${domain}/${lang}${cleanPath}`.replace(/\/+/g, '/').replace('https:/', 'https://');
  const fullImage = image.startsWith('http') ? image : `${domain}${image}`;

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

    // Canonical URL (Concentrates juice into main domain)
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Hreflang Tags (Reciprocal Handshake)
    const languages = ['en', 'fr', 'pt', 'ar'];
    languages.forEach(l => {
      let link = document.querySelector(`link[hreflang="${l}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', l);
        document.head.appendChild(link);
      }
      // Handshake logic: all languages point to their respective subdirectory versions
      link.setAttribute('href', `${domain}/${l}${cleanPath}`.replace(/\/+/g, '/').replace('https:/', 'https://'));
    });

    // x-default (usually points to the main version, here 'en')
    let xDefault = document.querySelector('link[hreflang="x-default"]');
    if (!xDefault) {
      xDefault = document.createElement('link');
      xDefault.setAttribute('rel', 'alternate');
      xDefault.setAttribute('hreflang', 'x-default');
      document.head.appendChild(xDefault);
    }
    xDefault.setAttribute('href', `${domain}/en${cleanPath}`.replace(/\/+/g, '/').replace('https:/', 'https://'));

    // Structured Data (GEO Fact-Density)
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

    return () => {
      // Clean up hreflang and structured data if component unmounts? 
      // Usually keep for crawlers, but in SPA transitions we might want to update
    };
  }, [fullTitle, description, fullImage, fullUrl, type, structuredData, cleanPath, lang]);

  return null;
}

