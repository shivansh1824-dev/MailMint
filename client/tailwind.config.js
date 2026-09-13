/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          1: '#0D1117',
          2: '#111827',
          3: '#161B22',
          4: '#1F2937',
        },
        accent: {
          primary: '#00C896',
          secondary: '#6366F1',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
        brandText: {
          primary: '#F0F0F0',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        brandBorder: '#2D3A4A',
      },
      borderRadius: {
        card: '8px',
        badge: '4px',
        button: '6px',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      maxWidth: {
        app: '1280px',
      },
    },
  },
  plugins: [],
}
