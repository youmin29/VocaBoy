/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['VT323', 'Courier Prime', 'monospace'],
        dot: ['VT323', 'monospace'],
      },
      colors: {
        lcd: {
          bg: '#9ca986',
          dark: '#2d3319',
          mid: '#5a6640',
          light: '#b8c49e',
        },
        device: {
          body: '#c8c8d0',
          shadow: '#9090a0',
          highlight: '#e8e8f0',
        },
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        pixelIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        scanline: 'scanline 8s linear infinite',
        pixelIn: 'pixelIn 0.15s ease-out',
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
}
