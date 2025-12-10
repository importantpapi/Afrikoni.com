/// <reference types="vite/client" />

// Type declarations for JSX components
declare module '@/components/SEO' {
  import { FC } from 'react';
  
  interface SEOProps {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    type?: string;
  }
  
  const SEO: FC<SEOProps>;
  export default SEO;
}

declare module '@/components/ScrollToTop' {
  import { FC } from 'react';
  
  const ScrollToTop: FC;
  export default ScrollToTop;
}

