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
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['"Libre Baskerville"', 'Georgia', 'serif'],
        display: ['"Libre Baskerville"', 'Georgia', 'serif'],
      },
      fontSize: {
        'display': ['clamp(32px,4vw,40px)', { lineHeight: '1.1',  fontWeight: '400' }],
        'h1':      ['clamp(22px,2.5vw,26px)', { lineHeight: '1.2',  fontWeight: '400' }],
        'h2':      ['17px',                  { lineHeight: '1.25', fontWeight: '400' }],
        'h3':      ['14px',                  { lineHeight: '1.3',  fontWeight: '400' }],
        'stat':    ['clamp(28px,3vw,36px)',  { lineHeight: '1',    fontWeight: '400' }],
        'body-l':  ['14px',                  { lineHeight: '1.75', fontWeight: '300' }],
        'body':    ['13px',                  { lineHeight: '1.6',  fontWeight: '400' }],
        'label':   ['11px',                  { lineHeight: '1.4',  fontWeight: '500' }],
        'eyebrow': ['10px',                  { lineHeight: '1',    fontWeight: '500' }],
        'caption': ['11px',                  { lineHeight: '1.5',  fontWeight: '400' }],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
