/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn-style semantic tokens (from CSS variables)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Premium AFRIKONI OS v2.0 Color System
        afrikoni: {
          // Primary Colors - Maintain brand identity
          gold: '#D4A937',           // Afrikoni Gold - Primary brand color (for backgrounds, borders)
          goldText: '#B8941F',       // Darker gold for text on light backgrounds (WCAG AA: 4.5:1)
          goldDark: '#8B6F0F',       // Darker gold for better contrast on light backgrounds
          goldLight: '#E4C27F',      // Lighter gold for dark backgrounds
          charcoal: '#121212',        // Deep Charcoal Black - Sidebar/headers
          // Secondary Colors
          sand: '#E8D8B5',            // Warm Sand
          ivory: '#FDF8F0',           // Ivory - Background
          clay: '#C9A77B',            // Desert Clay
          // Accents
          purple: '#8140FF',          // Royal Purple
          green: '#3AB795',           // Emerald Green
          red: '#E84855',             // Red for alerts
          // Text Colors - WCAG AA Compliant (4.5:1 on white/light backgrounds)
          'text-dark': '#1A150F',     // Darkened from #2E2A1F for 4.5:1 contrast on white
          'text-deep': '#2A1F15',     // Darkened from #3A2313 for better contrast (4.5:1)
          'text-light': '#FDF8F0',    // Light text on dark backgrounds
          // Legacy support (mapped to new colors)
          earth: "#4B2C17",
          deep: "#3A2313",
          chestnut: "#2A180E",        // Keep original for dark backgrounds
          chestnutText: "#1A1209",   // Darker variant for text on light (WCAG AA)
          cream: "#F3E5C7",
          offwhite: "#FDF8F0",
          'earth-brown': '#4B2C17',
          'deep-brown': '#3A2313',
          'dark-chestnut': '#2A180E',
          'emboss-gold': '#A17833',
          'highlight-gold': '#E4C27F',
          'warm-off-white': '#FDF8F0',
          'pure-white': '#FFFFFF',
          'brown-900': '#2A180E',
          'brown-800': '#3A2313',
          'brown-700': '#4B2C17',
          'gold-800': '#D4A937',
          'gold-700': '#A17833',
          'gold-600': '#E4C27F',
          'cream-100': '#F3E5C7',
          'cream-200': '#FDF8F0',
        },
        // Brand color shortcuts
        brand: {
          dark: '#121212',
          gold: '#D4A937',
          ivory: '#FDF8F0',
        },
      },
      backgroundColor: theme => ({
        ...theme('colors'),
        'brand-dark': '#2A180E',
        'brand-brown': '#4B2C17',
        'brand-cream': '#FFF9F3',
        // Semantic status backgrounds with opacity
        'success-15': 'hsl(var(--success) / 0.15)',
        'warning-15': 'hsl(var(--warning) / 0.15)',
        'info-15': 'hsl(var(--info) / 0.15)',
        'destructive-15': 'hsl(var(--destructive) / 0.15)',
      }),
      textColor: {
        brand: {
          gold: '#C69A47',
          cream: '#F3E5C7',
          brown: '#2A180E',
        },
      },
      borderColor: theme => ({
        ...theme('colors'),
        brand: {
          gold: '#C69A47',
          goldDark: '#A17833',
          brown: '#3A2313',
        },
        // Semantic status borders with opacity
        'success-20': 'hsl(var(--success) / 0.20)',
        'warning-20': 'hsl(var(--warning) / 0.20)',
        'info-20': 'hsl(var(--info) / 0.20)',
        'destructive-20': 'hsl(var(--destructive) / 0.20)',
      }),
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Remove serif - not used in institutional design
      },
      fontSize: {
        // H1 - Hero / Page title
        'h1': ['60px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h1-mobile': ['40px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        // H2 - Section titles
        'h2': ['40px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2-mobile': ['28px', { lineHeight: '1.2', fontWeight: '600' }],
        // H3 - Subsections / Card titles
        'h3': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        // Body - Primary text
        'body': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        // Meta / Labels / Badges
        'meta': ['14px', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.02em' }],
      },
      boxShadow: {
        'afrikoni': '0 2px 10px rgba(212,169,55,0.25)',
        'afrikoni-lg': '0 4px 20px rgba(212,169,55,0.3)',
        'afrikoni-xl': '0 8px 30px rgba(212,169,55,0.35)',
        'afrikoni-gold': '0 0 20px rgba(212,169,55,0.4)',
        'premium': '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        'premium-lg': '0 8px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'afrikoni': '12px',
        'afrikoni-lg': '16px',
      },
    },
  },
  plugins: [],
}
