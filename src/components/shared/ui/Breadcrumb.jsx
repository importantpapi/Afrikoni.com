import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Breadcrumb navigation component
 * Automatically generates breadcrumbs based on current route
 */
export default function Breadcrumb({ items = null, className = '' }) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbs = items || generateBreadcrumbs(location.pathname);
  
  if (!breadcrumbs || breadcrumbs.length === 0) return null;
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center gap-2 text-os-sm text-afrikoni-deep mb-4 md:mb-6 ${className}`}
    >
      <ol className="flex items-center gap-2 flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const isHome = crumb.path === '/';
          
          return (
            <li 
              key={idx}
              className="flex items-center gap-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {idx > 0 && (
                <ChevronRight 
                  className="w-4 h-4 text-afrikoni-deep/50 flex-shrink-0" 
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span 
                  className="text-afrikoni-chestnut font-semibold"
                  itemProp="name"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-os-accent transition-colors flex items-center gap-1"
                  itemProp="item"
                >
                  {isHome && <Home className="w-4 h-4" aria-hidden="true" />}
                  <span itemProp="name">{crumb.label}</span>
                </Link>
              )}
              <meta itemProp="position" content={String(idx + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname) {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ path: '/', label: 'Home' }];
  
  // Route to label mapping
  const routeLabels = {
    'marketplace': 'Marketplace',
    'products': 'Products',
    'product': 'Product',
    'categories': 'Categories',
    'category': 'Category',
    'suppliers': 'Suppliers',
    'supplier': 'Supplier',
    'about': 'About Us',
    'contact': 'Contact',
    'help': 'Help',
    'blog': 'Blog',
    'faq': 'FAQ',
    'services': 'Services',
    'buyers': 'For Buyers',
    'logistics': 'Logistics',
    'community': 'Community',
    'trust': 'Trust Center',
    'pricing': 'Pricing',
    'resources': 'Resources'
  };
  
  let currentPath = '';
  paths.forEach((segment, idx) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || formatLabel(segment);
    breadcrumbs.push({ path: currentPath, label });
  });
  
  return breadcrumbs;
}

/**
 * Format segment into readable label
 */
function formatLabel(segment) {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


