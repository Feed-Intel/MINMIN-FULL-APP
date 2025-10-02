module.exports = {
  content: [
    '../../mobile/app/**/*.{ts,tsx}',
    '../../mobile/components/**/*.{ts,tsx}',
    './node_modules/@minmin/theme/dist/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(249,250,251)',
        surface: 'rgb(255,255,255)',
        text: 'rgb(31,41,55)',
        primary: 'rgb(115,182,97)',
        accent: 'rgb(255,183,43)',
      },
      borderRadius: {
        xl: 20,
      },
    },
  },
};
