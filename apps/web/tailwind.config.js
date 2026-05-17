/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000", // True Matte Black
        surface: "#09090A", // Flat contrast black
        primary: {
          start: "#FF007F", // Saturated Neon Pink/Fuchsia
          end: "#00F0FF", // Ultra Neon Cyan
        },
        positive: "#00FF66", // Pure Electric Emerald
        critical: "#FF0033", // Vivid Warning Crimson
        muted: "#8A8A93", // Zinc 400
        borderMuted: "#27272A", // Zinc 800
      },
      fontFamily: {
        sans: ['"Geist Sans"', '"SF Pro Display"', 'sans-serif'],
        mono: ['"Geist Mono"', '"Inter"', 'monospace'],
      },
      animation: {
        'equalizer': 'equalizer 1.5s ease-in-out infinite',
        'wiggle': 'wiggle 0.2s ease-in-out infinite',
        'fade-out': 'fadeOut 0.4s ease-out forwards',
      },
      keyframes: {
        equalizer: {
          '0%, 100%': { height: '10px' },
          '50%': { height: '24px' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        fadeOut: {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '100%': { opacity: 0, transform: 'scale(0.8)' },
        }
      }
    },
  },
  plugins: [],
}
