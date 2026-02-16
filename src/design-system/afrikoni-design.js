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
    bg: 'bg-os-accent/15',
    text: 'text-os-accent',
    iconBg: 'bg-os-accent/20',
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

/**
 * AFRIKONI TYPOGRAPHY SYSTEM
 * Institutional, Trust-driven, Enterprise-grade
 * 
 * STRICT TYPOGRAPHIC ROLES - NO DEVIATIONS
 */
export const TYPOGRAPHY = {
  // H1 - Hero / Page title
  // Desktop: 60px, Mobile: 40px
  // font-weight: 700, line-height: 1.1, letter-spacing: -0.02em
  h1: 'text-h1-mobile md:text-h1 font-bold leading-[1.1] tracking-[-0.02em] text-afrikoni-text-dark',
  
  // H2 - Section titles
  // Desktop: 40px, Mobile: 28px
  // font-weight: 600, line-height: 1.2
  h2: 'text-h2-mobile md:text-h2 font-semibold leading-[1.2] text-afrikoni-text-dark',
  
  // H3 - Subsections / Card titles
  // 22px
  // font-weight: 600, line-height: 1.3
  h3: 'text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark',
  
  // Body - Primary text
  // 18px
  // font-weight: 400, line-height: 1.6
  body: 'text-body font-normal leading-[1.6] text-afrikoni-text-dark',
  
  // Meta / Labels / Badges
  // 14px
  // font-weight: 500, letter-spacing: 0.02em
  meta: 'text-meta font-medium leading-[1.5] tracking-[0.02em] text-afrikoni-text-dark/70',
  
  // Legacy support (deprecated - use above)
  sectionTitle: 'text-h2-mobile md:text-h2 font-semibold text-afrikoni-text-dark mb-4 pb-3 border-b-2 border-os-accent',
  kpiNumber: 'text-h1-mobile md:text-h1 font-bold text-afrikoni-text-dark',
  kpiLabel: 'text-meta font-medium text-afrikoni-text-dark/70',
};

export const SHADOWS = {
  card: 'shadow-os-md',
  cardHover: 'shadow-os-md-lg',
  gold: 'shadow-os-accent',
};

export const BORDERS = {
  card: 'border border-os-accent/20',
  cardHover: 'border-os-accent/40',
  gold: 'border-os-accent',
  goldUnderline: 'border-b-2 border-os-accent',
};

export const BACKGROUND_PATTERN = {
  opacity: 'opacity-[0.05]',
  style: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A937' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
};

