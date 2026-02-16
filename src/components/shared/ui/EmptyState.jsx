import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './button';
import {
  Package, ShoppingCart, FileText, MessageSquare, 
  Wallet, BarChart3, Inbox, Search
} from 'lucide-react';

const iconMap = {
  products: Package,
  orders: ShoppingCart,
  rfqs: FileText,
  messages: MessageSquare,
  payments: Wallet,
  analytics: BarChart3,
  default: Inbox
};

const configMap = {
  products: {
    icon: Package,
    title: 'No products yet',
    description: 'Start building your catalog by adding your first product listing.',
    cta: 'Add Product',
    ctaLink: '/dashboard/products/new',
    iconColor: 'text-os-accent',
    iconBg: 'bg-os-accent/20'
  },
  orders: {
    icon: ShoppingCart,
    title: 'No orders yet',
    description: 'Your orders will appear here once you start making purchases.',
    cta: 'Browse Suppliers',
    ctaLink: '/suppliers',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50'
  },
  rfqs: {
    icon: FileText,
    title: 'No RFQs yet',
    description: 'Create a Request for Quotation to get competitive pricing from suppliers.',
    cta: 'Create RFQ',
    ctaLink: '/rfq/create',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50'
  },
  messages: {
    icon: MessageSquare,
    title: 'No conversations yet',
    description: 'Start a conversation with suppliers or buyers to begin trading.',
    cta: 'Start Conversation',
    ctaLink: '/messages',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50'
  },
  payments: {
    icon: Wallet,
    title: 'No transactions yet',
    description: 'Your payment history and transactions will appear here.',
    cta: 'View Transactions',
    ctaLink: '/dashboard/payments',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50'
  },
  analytics: {
    icon: BarChart3,
    title: 'No data yet',
    description: 'Connect your listings and start trading to see analytics and insights.',
    cta: 'Connect your listings',
    ctaLink: '/dashboard/products',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50'
  },
  default: {
    icon: Inbox,
    title: 'No items found',
    description: 'There are no items to display at this time.',
    cta: 'Get Started',
    ctaLink: '/dashboard',
    iconColor: 'text-os-accent',
    iconBg: 'bg-os-accent/20'
  }
};

export default function EmptyState({ 
  type = 'default', 
  title, 
  description, 
  cta, 
  ctaLink,
  onCtaClick,
  className = ''
}) {
  const config = configMap[type] || configMap.default;
  const Icon = config.icon;
  
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalCta = cta || config.cta;
  const finalCtaLink = ctaLink || config.ctaLink;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      <div className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mb-6`}>
        <Icon className={`w-10 h-10 ${config.iconColor}`} />
      </div>
      
      <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-2 text-center">
        {finalTitle}
      </h3>
      
      <p className="text-afrikoni-deep text-center max-w-md mb-6">
        {finalDescription}
      </p>
      
      {finalCta && (
        onCtaClick ? (
          <Button variant="primary" onClick={onCtaClick}>
            {finalCta}
          </Button>
        ) : finalCtaLink ? (
          <Link to={finalCtaLink}>
            <Button variant="primary">{finalCta}</Button>
          </Link>
        ) : (
          <Button variant="primary">{finalCta}</Button>
        )
      )}
    </motion.div>
  );
}

