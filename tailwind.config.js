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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // SEMANTIC STATUS COLORS
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
        // 2026 PREMIUM DESIGN SYSTEM: "OS" PALETTE
        os: {
          accent: 'var(--os-accent)',           // Refined Hermes Orange
          'accent-soft': 'var(--os-accent-soft)',
          'accent-bg': 'var(--os-accent-bg)',   // Original for backgrounds
          'accent-text': 'var(--os-accent-text)', // Extra dark for small text
          'accent-light': 'var(--os-accent-light)',
          'accent-dark': 'var(--os-accent-dark)',
          green: '#2CD178',
          emerald: '#10B981',
          amber: '#F59E0B',
          red: '#FF3B30',
          blue: '#007AFF',
          action: '#0055FF', // Deep Action Blue
          bg: 'var(--os-bg)',
          card: 'var(--os-surface)',
          stroke: 'var(--os-stroke)',
          'text-primary': 'var(--os-text-primary)',
          'text-secondary': 'var(--os-text-secondary)',
          muted: '#86868B',
        },
        // Legacy Brand support (mapping for gradual migration)
        afrikoni: {
          earth: 'hsl(var(--afrikoni-earth))',
          deep: 'hsl(var(--afrikoni-deep))',
          chestnut: 'hsl(var(--afrikoni-chestnut))',
          cream: 'hsl(var(--afrikoni-cream))',
          offwhite: 'hsl(var(--afrikoni-offwhite))',
          ivory: 'hsl(var(--afrikoni-ivory))',
          gold: 'hsl(var(--afrikoni-brand-gold))',
          'gold-shimmer': 'hsl(var(--afrikoni-gold-shimmer))',
          'gold-deep': 'hsl(var(--afrikoni-gold-deep))',
          'gold-crest': '#C5A037', // Official Brand Gold
          'ivory-base': '#FAF9F6', // Premium Neutral
          'hermes-cream': '#FDF8F0', // Warm Materiality
          charcoal: '#121212',
        }
      },
      fontSize: {
        // 2026 SEMANTIC TYPE SCALE
        'os-xs': ['12px', { lineHeight: '1.5', fontWeight: '500' }],      // Meta / Labels
        'os-sm': ['14px', { lineHeight: '1.5', fontWeight: '500' }],      // Body secondary
        'os-base': ['16px', { lineHeight: '1.6', fontWeight: '400' }],    // Body primary
        'os-lg': ['18px', { lineHeight: '1.5', fontWeight: '400' }],      // Lead text
        'os-xl': ['20px', { lineHeight: '1.4', fontWeight: '600' }],      // H4
        'os-2xl': ['24px', { lineHeight: '1.3', fontWeight: '600' }],     // H3
        'os-3xl': ['30px', { lineHeight: '1.2', fontWeight: '700' }],     // H2
        'os-4xl': ['36px', { lineHeight: '1.1', fontWeight: '700' }],     // H1 Mobile
        'os-5xl': ['48px', { lineHeight: '1.1', fontWeight: '700' }],     // H1 Desktop
      },
      spacing: {
        'os-tight': '1rem',      // 16px
        'os-normal': '1.5rem',   // 24px
        'os-loose': '2rem',      // 32px
        'os-generous': '3rem',   // 48px
      },
      boxShadow: {
        'os-sm': '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'os-md': '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'os-lg': '0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
        'os-gold': '0 4px 20px rgba(212,169,55,0.25)',
        'os-ambient': '0 4px 20px -1px rgba(100, 80, 40, 0.05)', // High-fidelity subtle depth
        'premium': '0 4px 24px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'os-sm': '12px',   // Small cards, inputs
        'os-md': '20px',   // Standard cards
        'os-lg': '32px',   // Hero sections
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
