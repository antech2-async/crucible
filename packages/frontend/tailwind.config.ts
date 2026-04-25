import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '9999px',
    },
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-low': 'var(--surface-low)',
        'surface-container': 'var(--surface-container)',
        'surface-high': 'var(--surface-high)',
        primary: 'var(--primary)',
        'primary-muted': 'var(--primary-muted)',
        'on-primary': 'var(--on-primary)',
        'on-surface': 'var(--on-surface)',
        'on-surface-muted': 'var(--on-surface-muted)',
        'on-surface-dim': 'var(--on-surface-dim)',
        'tier-elite': 'var(--tier-elite)',
        'tier-high': 'var(--tier-high)',
        'tier-mid': 'var(--tier-mid)',
        'tier-low': 'var(--tier-low)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        radar: 'radar 4s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
