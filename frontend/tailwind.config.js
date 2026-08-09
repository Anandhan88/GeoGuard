/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#050B12',
          secondary: '#0A1220',
          tertiary: '#0F1A28',
        },
        surface: {
          DEFAULT: '#111E2C',
          light: '#162536',
          lighter: '#1B2D40',
        },
        accent: {
          primary: '#19D3AE',
          secondary: '#20B8E8',
          blue: '#20B8E8',
          cyan: '#19D3AE',
          emerald: '#28D7A1',
          amber: '#F5B83D',
          red: '#FF5C5C',
          purple: '#8b5cf6',
          pink: '#ec4899',
        },
        warning: '#F5B83D',
        danger: '#FF5C5C',
        success: '#28D7A1',
        text: {
          primary: '#F0F4F8',
          secondary: '#A0B0C0',
          muted: '#6B7D8F',
        },
      },
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient-shift 8s ease infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'radar': 'radar-sweep 4s linear infinite',
        'scan-line': 'scan-line 3s ease-in-out infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(25, 211, 174, 0.15)',
        'glow-blue': '0 0 20px rgba(32, 184, 232, 0.15)',
        'glow-red': '0 0 20px rgba(255, 92, 92, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
