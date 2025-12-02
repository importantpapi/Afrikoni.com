/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium AFRIKONI OS v2.0 Color System
        afrikoni: {
          // Primary Colors
          gold: '#D4A937',           // Afrikoni Gold - Primary brand color
          charcoal: '#121212',        // Deep Charcoal Black - Sidebar/headers
          // Secondary Colors
          sand: '#E8D8B5',            // Warm Sand
          ivory: '#FDF8F0',           // Ivory - Background
          clay: '#C9A77B',            // Desert Clay
          // Accents
          purple: '#8140FF',          // Royal Purple
          green: '#3AB795',           // Emerald Green
          red: '#E84855',             // Red for alerts
          // Text Colors
          'text-dark': '#2E2A1F',     // Dark brown/black for headings
          'text-deep': '#3A2313',     // Deep text
          'text-light': '#FDF8F0',    // Light text on dark
          // Legacy support (mapped to new colors)
          earth: "#4B2C17",
          deep: "#3A2313",
          chestnut: "#2A180E",
          goldDark: "#A17833",
          goldLight: "#E4C27F",
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
      }),
      textColor: {
        brand: {
          gold: '#C69A47',
          cream: '#F3E5C7',
          brown: '#2A180E',
        },
      },
      borderColor: {
        brand: {
          gold: '#C69A47',
          goldDark: '#A17833',
          brown: '#3A2313',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
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

