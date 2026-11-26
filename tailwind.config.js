/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5', ink: '#0F172A', muted: '#64748B', surface: '#FFFFFF',
        soft: '#F1F5F9', line: '#E2E8F0', success: '#16A34A', warn: '#D97706', danger: '#DC2626',
      },
      borderRadius: { card: '12px', lg2: '16px', xl2: '24px' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
