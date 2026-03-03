/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base
        dark:    '#09040A',
        surf:    '#160C10',
        surf2:   '#1F1015',
        surf3:   '#2A1620',
        // Bordeaux / AIS
        bx:      '#5C1020',
        'bx-l':  '#8B2438',
        'bx-d':  '#3A0A14',
        // Gold
        gold:    '#C9A24A',
        'gold-l':'#E8C97A',
        'gold-d':'#8A6A28',
        // Cream
        cream:   '#F2EBE0',
        'cream-d':'#C8BEB0',
        // Roles
        doc:     '#1A4A5C',
        'doc-l': '#2A6A7C',
        'doc-acc':'#5ABCD4',
        dir:     '#1E4A2E',
        'dir-l': '#2A6A3E',
        'dir-acc':'#5AC484',
        adm:     '#1E1A4A',
        'adm-l': '#2E2A6A',
        'adm-acc':'#8A7FD4',
        // Semantic
        success: '#5DBF7A',
        warning: '#E8A04A',
        danger:  '#E06060',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '3rem',
      },
      backgroundImage: {
        'bx-gradient': 'linear-gradient(135deg, #8B2438 0%, #5C1020 55%, #3A0A14 100%)',
        'gold-gradient': 'linear-gradient(135deg, #8A6A28, #C9A24A)',
        'doc-gradient': 'linear-gradient(135deg, #2A6A7C, #1A4A5C)',
        'dir-gradient': 'linear-gradient(135deg, #2A6A3E, #1E4A2E)',
        'adm-gradient': 'linear-gradient(135deg, #2E2A6A, #1E1A4A)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'prog-fill': 'progFill 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-dot': 'pulseDot 1.4s infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideIn:  { from: { transform: 'translateX(100%)', opacity: '0.7' }, to: { transform: 'translateX(0)', opacity: '1' } },
        progFill: { from: { width: '0' }, to: { width: '100%' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
    },
  },
  plugins: [],
}
