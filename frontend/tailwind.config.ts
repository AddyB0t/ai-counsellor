import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /* ============================================
         FONT FAMILIES
         Use: font-sans (body), font-display (headlines)
         ============================================ */
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        display: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
      },

      /* ============================================
         FONT SIZES
         Typography scale for consistent sizing
         ============================================ */
      fontSize: {
        'display': ['3.25rem', { lineHeight: '1.2', fontWeight: '800' }],
        'headline': ['2.75rem', { lineHeight: '1.2', fontWeight: '700' }],
        'title': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.9375rem', { lineHeight: '1.6' }],
      },

      /* ============================================
         COLORS
         All colors reference CSS variables from theme.css
         Use: bg-primary, text-accent, border-border, etc.
         ============================================ */
      colors: {
        // Semantic colors
        background: 'var(--color-bg)',
        foreground: 'var(--color-text)',

        // Primary palette
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },

        // Accent palette
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          light: 'var(--color-accent-light)',
          dark: 'var(--color-accent-dark)',
        },

        // Secondary palette
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          light: 'var(--color-secondary-light)',
        },

        // Text colors
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },

        // Border colors
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
          focus: 'var(--color-border-focus)',
        },

        // Status colors
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
        },
      },

      /* ============================================
         BORDER RADIUS
         Use: rounded-sm, rounded-lg, rounded-2xl, etc.
         ============================================ */
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
      },

      /* ============================================
         BOX SHADOW
         Use: shadow-sm, shadow-lg, shadow-glow, etc.
         ============================================ */
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
        'primary': 'var(--shadow-primary)',
      },

      /* ============================================
         TRANSITIONS
         Use: transition-fast, transition-slow
         ============================================ */
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [],
}

export default config
