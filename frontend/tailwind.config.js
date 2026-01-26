module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066ff',
        primaryDark: '#0052cc',
        primaryLight: '#3385ff',
        secondary: '#64748b',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#eab308',
        pending: '#f59e0b',
        blue: {
          50: '#f0f7ff',
          100: '#e0eeff',
          200: '#c1ddff',
          300: '#a2ccff',
          400: '#7bb3ff',
          500: '#5599ff',
          600: '#3d7fe8',
          700: '#2d5cc9',
          800: '#1e3aaa',
          900: '#0f1a4d',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.50)',
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(61, 127, 232, 0.1) 100%)',
        'gradient-blue-dark': 'linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(61, 127, 232, 0.15) 100%)',
      }
    },
  },
  plugins: [],
}
