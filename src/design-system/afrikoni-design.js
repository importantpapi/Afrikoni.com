/**
 * AFRIKONI OS v2.5 Design System
 * Centralized design tokens and constants for premium enterprise UI
 */

export const AFRIKONI_COLORS = {
  // Primary Brand Colors
  gold: '#D4A937',
  charcoal: '#121212',
  
  // Secondary Colors
  sand: '#E8D8B5',
  ivory: '#FDF8F0',
  clay: '#C9A77B',
  
  // Accents
  purple: '#8140FF',
  green: '#3AB795',
  red: '#E84855',
  
  // Text Colors
  textDark: '#2E2A1F',
  textDeep: '#3A2313',
  textLight: '#FDF8F0',
};

export const KPI_ICON_COLORS = {
  orders: {
    bg: 'bg-afrikoni-gold/15',
    text: 'text-afrikoni-gold',
    iconBg: 'bg-afrikoni-gold/20',
  },
  rfqs: {
    bg: 'bg-afrikoni-purple/15',
    text: 'text-afrikoni-purple',
    iconBg: 'bg-afrikoni-purple/20',
  },
  products: {
    bg: 'bg-afrikoni-green/15',
    text: 'text-afrikoni-green',
    iconBg: 'bg-afrikoni-green/20',
  },
  messages: {
    bg: 'bg-afrikoni-red/15',
    text: 'text-afrikoni-red',
    iconBg: 'bg-afrikoni-red/20',
  },
  neutral: {
    bg: 'bg-afrikoni-charcoal/10',
    text: 'text-afrikoni-charcoal',
    iconBg: 'bg-afrikoni-charcoal/15',
  },
};

export const ANIMATIONS = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  hoverLift: {
    whileHover: { y: -2, transition: { duration: 0.2 } },
  },
  hoverGlow: {
    whileHover: { 
      boxShadow: '0 8px 32px rgba(212, 169, 55, 0.15)',
      transition: { duration: 0.2 }
    },
  },
};

export const SPACING = {
  section: 'mb-8 md:mb-12',
  card: 'p-5 md:p-6',
  title: 'mb-6 md:mb-8',
};

export const TYPOGRAPHY = {
  h1: 'text-3xl md:text-4xl font-bold text-afrikoni-text-dark leading-tight',
  h2: 'text-2xl md:text-3xl font-bold text-afrikoni-text-dark leading-tight',
  h3: 'text-xl md:text-2xl font-semibold text-afrikoni-text-dark',
  sectionTitle: 'text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider mb-4 pb-3 border-b-2 border-afrikoni-gold',
  body: 'text-sm md:text-base text-afrikoni-text-dark/70',
  kpiNumber: 'text-3xl md:text-4xl font-bold text-afrikoni-text-dark',
  kpiLabel: 'text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide',
};

export const SHADOWS = {
  card: 'shadow-premium',
  cardHover: 'shadow-premium-lg',
  gold: 'shadow-afrikoni-gold',
};

export const BORDERS = {
  card: 'border border-afrikoni-gold/20',
  cardHover: 'border-afrikoni-gold/40',
  gold: 'border-afrikoni-gold',
  goldUnderline: 'border-b-2 border-afrikoni-gold',
};

export const BACKGROUND_PATTERN = {
  opacity: 'opacity-[0.05]',
  style: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A937' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
};

