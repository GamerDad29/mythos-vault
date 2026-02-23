/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cinzel"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"Courier New"', 'monospace'],
      },
      colors: {
        background: 'hsl(15 6% 8%)',
        foreground: 'hsl(15 4% 92%)',
        card: 'hsl(20 6% 10%)',
        border: 'hsl(15 8% 18%)',
        primary: 'hsl(25 100% 32%)',
        muted: 'hsl(15 6% 55%)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}
