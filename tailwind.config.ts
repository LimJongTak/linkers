import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#111827',
          light: '#374151',
          accent: '#4FC3F7',
        },
      },
    },
  },
  plugins: [],
}

export default config
