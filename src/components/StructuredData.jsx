export default function StructuredData({ type = 'Organization', data = {} }) {
  const getStructuredData = () => {
    switch (type) {
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'AFRIKONI',
          url: 'https://afrikoni.com',
          logo: 'https://afrikoni.com/logo.png',
          description: 'Premier B2B marketplace connecting buyers and suppliers across Africa',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Lagos',
            addressCountry: 'NG'
          },
          sameAs: [
            'https://twitter.com/afrikoni',
            'https://linkedin.com/company/afrikoni',
            'https://facebook.com/afrikoni'
          ]
        };
      
      case 'Product':
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name || 'Product',
          description: data.description || '',
          image: data.image || '',
          brand: {
            '@type': 'Brand',
            name: data.brand || 'AFRIKONI Supplier'
          },
          offers: {
            '@type': 'Offer',
            price: data.price || '0',
            priceCurrency: data.currency || 'USD',
            availability: 'https://schema.org/InStock'
          }
        };
      
      case 'WebSite':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'AFRIKONI',
          url: 'https://afrikoni.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://afrikoni.com/products?search={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        };
      
      default:
        return null;
    }
  };

  const structuredData = getStructuredData();
  
  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

