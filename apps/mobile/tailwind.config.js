/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          light: '#EEF2FF',
          dark: '#4F46E5',
        },
        success: {
          DEFAULT: '#059669',
          light: '#ECFDF5',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
        },
        surface: { DEFAULT: '#FFFFFF',   dark: '#14142A' },
        surface2: { DEFAULT: '#ECEEF6',  dark: '#1D1D36' },
        border: { DEFAULT: '#E8EAF0',    dark: '#2A2A4A' },
        bg: { DEFAULT: '#F4F5FA',        dark: '#0C0C1A' },
        text: {
          DEFAULT: '#1E1B4B',
          2: '#6B7280',
          3: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['DMSans_400Regular', 'System'],
        'dm-light':     ['DMSans_300Light',    'System'],
        'dm-regular':   ['DMSans_400Regular',  'System'],
        'dm-medium':    ['DMSans_500Medium',   'System'],
        'dm-semibold':  ['DMSans_600SemiBold', 'System'],
        'dm-bold':      ['DMSans_700Bold',     'System'],
        'dm-extrabold': ['DMSans_800ExtraBold','System'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
