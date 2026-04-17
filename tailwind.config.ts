import type { Config } from 'tailwindcss';

// Aligned to kolo.xyz visual language: light-first, generous whitespace,
// large display type, black hero/inverse surfaces, green accent used sparingly.
// Tokens: .claude/skills/design-system/SKILL.md

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:   '#ffffff', // page — white
          card:   '#f8f8f8', // raised card surface
          hover:  '#f2f2f2', // strong / hover
          invert: '#000000', // hero / inverse sections
        },
        border: {
          DEFAULT: '#e5e5e5',
          strong:  '#d4d4d4',
          invert:  '#1a1a1a',
        },
        accent: {
          DEFAULT: '#13d659', // kolo green — sparing, for highlights
          dim:     '#0fb84c',
        },
        text: {
          primary:   '#000000',
          secondary: '#333333',
          tertiary:  '#666666',
          invert:    '#ffffff',
        },
        muted:     '#737373',
        tier: {
          bronze: '#cd7f32',
          silver: '#8a8a8a',
          gold:   '#c99a2e',
        },
      },
      fontFamily: {
        sans: ['Fixelvariable', 'var(--font-inter)', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Kolo display scale
        'display-sm': ['58.72px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['66.06px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['88.08px', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-xl': ['161.48px', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        xs: '8px',
        sm: '11px',
        md: '16px',
      },
      transitionDuration: {
        instant: '200ms',
        fast:    '300ms',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        glow: '0 0 24px -8px rgba(19, 214, 89, 0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
