/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official AFRIKONI BRAND BOOK V1 Colors
        afrikoni: {
          earth: "#4B2C17",
          deep: "#3A2313",
          chestnut: "#2A180E",
          gold: "#C69A47",
          goldDark: "#A17833",
          goldLight: "#E4C27F",
          cream: "#F3E5C7",
          offwhite: "#FFF9F3",
          // Legacy support (mapped to new colors)
          'earth-brown': '#4B2C17',
          'deep-brown': '#3A2313',
          'dark-chestnut': '#2A180E',
          'emboss-gold': '#A17833',
          'highlight-gold': '#E4C27F',
          'warm-off-white': '#FFF9F3',
          'pure-white': '#FFFFFF',
          'brown-900': '#2A180E',
          'brown-800': '#3A2313',
          'brown-700': '#4B2C17',
          'gold-800': '#C69A47',
          'gold-700': '#A17833',
          'gold-600': '#E4C27F',
          'cream-100': '#F3E5C7',
          'cream-200': '#FFF9F3',
        },
        // Brand color shortcuts
        brand: {
          dark: '#2A180E',
          brown: '#4B2C17',
          cream: '#FFF9F3',
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
        'afrikoni': '0 2px 10px rgba(198,154,71,0.25)',
        'afrikoni-lg': '0 4px 20px rgba(198,154,71,0.3)',
        'afrikoni-xl': '0 8px 30px rgba(198,154,71,0.35)',
      },
    },
  },
  plugins: [],
}

