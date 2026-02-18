import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/i18n/LanguageContext';

export default function ProductSchema({ product }) {
    const { lang } = useLanguage();

    if (!product) return null;

    const schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.images || [product.image],
        "description": product.description,
        "sku": product.id,
        "brand": {
            "@type": "Brand",
            "name": product.supplier || "Afrikoni Supplier"
        },
        "offers": {
            "@type": "Offer",
            "url": `https://afrikoni.com/${lang}/product/${product.id}`,
            "priceCurrency": "USD",
            "price": product.price,
            "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
}
