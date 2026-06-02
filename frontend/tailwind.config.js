/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#050505',
        accentCyan: 'var(--accent-cyan)',
        accentPurple: 'var(--accent-purple)',
        starkWhite: '#F5F5F5',
        /* Theme-aware semantic colors */
        'theme-bg': 'var(--bg-color)',
        'theme-text': 'var(--text-color)',
        'theme-heading': 'var(--heading-color)',
        'theme-muted': 'var(--text-muted)',
        'theme-subtle': 'var(--text-subtle)',
        'theme-surface': 'var(--surface-bg)',
        'theme-border': 'var(--surface-border)',
        'theme-border-subtle': 'var(--surface-border-subtle)',
        'theme-input': 'var(--input-bg)',
        'theme-input-border': 'var(--input-border)',
        'theme-input-placeholder': 'var(--input-placeholder)',
        'theme-btn-bg': 'var(--btn-bg)',
        'theme-btn-text': 'var(--btn-text)',
        'theme-footer': 'var(--footer-bg)',
        'theme-preloader-bg': 'var(--preloader-bg)',
        'theme-preloader-text': 'var(--preloader-text)',
        'theme-icon-bg': 'var(--icon-bg)',
        'theme-tab-active-bg': 'var(--tab-active-bg)',
        'theme-tab-active-text': 'var(--tab-active-text)',
        'theme-tab-inactive-bg': 'var(--tab-inactive-bg)',
        'theme-tab-inactive-border': 'var(--tab-inactive-border)',
        'theme-tab-inactive-text': 'var(--tab-inactive-text)',
        'theme-table-hover': 'var(--table-hover)',
        'theme-badge': 'var(--badge-bg)',
        'theme-slot': 'var(--slot-bg)',
        'theme-overlay': 'var(--overlay-bg)',
        'theme-gradient-to': 'var(--gradient-to)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
