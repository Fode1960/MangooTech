/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charte graphique MangooTech
        'mangoo-orange': '#ff6b35',
        'mangoo-green': '#1a5f3f',
        'mangoo-light-green': '#4ade80',
        'mangoo-dark-green': '#166534',
        'mangoo-light-orange': '#fed7aa',
        'mangoo-dark-orange': '#ea580c',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'mangoo': '0 4px 6px -1px rgba(255, 107, 53, 0.1), 0 2px 4px -1px rgba(255, 107, 53, 0.06)',
        'mangoo-lg': '0 10px 15px -3px rgba(255, 107, 53, 0.1), 0 4px 6px -2px rgba(255, 107, 53, 0.05)',
      },
      backgroundImage: {
        'mangoo-gradient': 'linear-gradient(135deg, #ff6b35 0%, #1a5f3f 100%)',
        'mangoo-gradient-light': 'linear-gradient(135deg, #fed7aa 0%, #4ade80 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-mangoo': 'bounceMangoo 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceMangoo: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
