import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: '2px',
      DEFAULT: '2px',
      md: '4px',
      lg: '6px',
      xl: '8px',
      '2xl': '8px',
      '3xl': '8px',
      full: '9999px',
    },
    extend: {
      colors: {
        surface: token('--surface'),
        'surface-low': token('--surface-low'),
        'surface-container': token('--surface-container'),
        'surface-high': token('--surface-high'),
        'surface-highest': token('--surface-highest'),
        primary: token('--primary'),
        'primary-muted': token('--primary-muted'),
        secondary: token('--secondary'),
        'on-primary': token('--on-primary'),
        'on-surface': token('--on-surface'),
        'on-surface-muted': token('--on-surface-muted'),
        'on-surface-dim': token('--on-surface-dim'),
        'tier-elite': token('--tier-elite'),
        'tier-high': token('--tier-high'),
        'tier-mid': token('--tier-mid'),
        'tier-low': token('--tier-low'),
        border: token('--border'),
        'border-strong': token('--border-strong'),
        danger: token('--danger'),
        success: token('--success'),
        warning: token('--warning'),
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
