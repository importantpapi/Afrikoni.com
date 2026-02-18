import { useLanguage } from '@/i18n/LanguageContext';

export default function StructuredData({ type = 'Organization', data = {} }) {
  const { language } = useLanguage();
  const baseUrl = 'https://afrikoni.com';
  const langUrl = `${baseUrl}/${language}`;

  const getStructuredData = () => {
    switch (type) {
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'AFRIKONI',
          url: langUrl,
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
          url: langUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${langUrl}/products?search={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        };

      case 'FAQPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: Array.isArray(data.items) ? data.items.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer
            }
          })) : []
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

