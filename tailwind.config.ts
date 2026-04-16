import type { Config } from 'tailwindcss';

// Spec design system (section 8): dark theme with cyan/teal accents.
// See docs/kolo-ambassador-spec.md §8.

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
          base:   '#0a0a0f', // page background (near-black)
          card:   '#111118', // card background (dark navy)
          hover:  '#15151f',
        },
        border: {
          DEFAULT: '#1e1e2e',
          strong:  '#2a2a3e',
        },
        accent: {
          DEFAULT: '#00f0c0', // primary cyan/teal
          dim:     '#00c89e',
        },
        secondary: '#7c3aed', // purple
        muted:     '#9ca3af',
        tier: {
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold:   '#ffd700',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -8px rgba(0, 240, 192, 0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
