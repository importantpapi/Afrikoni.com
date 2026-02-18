import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SUPPORTED_LANGS = ['en', 'fr', 'pt', 'ar'];

export default function HreflangTags() {
    const location = useLocation();
    const path = location.pathname;

    // Extract current language and clean path
    const currentLang = path.split('/')[1];
    const cleanPath = SUPPORTED_LANGS.includes(currentLang)
        ? path.substring(3)
        : path;

    // Base URL
    const baseUrl = 'https://afrikoni.com';

    return (
        <Helmet>
            {/* x-default (English) */}
            <link rel="alternate" hreflang="x-default" href={`${baseUrl}/en${cleanPath}`} />

            {/* Language specific versions */}
            {SUPPORTED_LANGS.map(lang => (
                <link
                    key={lang}
                    rel="alternate"
                    hreflang={lang}
                    href={`${baseUrl}/${lang}${cleanPath}`}
                />
            ))}
        </Helmet>
    );
}
