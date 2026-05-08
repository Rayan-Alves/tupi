/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spirit:    '#1B3A5C',
        mind:      '#D4890A',
        body:      '#2D5016',
        tabatinga: '#C4A882',
        urucum:    '#A83228',
        areia:     '#F5F0E8',
        sidebar:   '#000000',
      },
      fontFamily: {
        sans:    ['"Courier New"', 'Courier', 'monospace'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
