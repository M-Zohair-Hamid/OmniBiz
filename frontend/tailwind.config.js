module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488',      // teal-600
        primaryDark: '#0f766e',  // teal-700
        primaryLight: '#14b8a6', // teal-500
        secondary: '#64748b',    // slate-500
        success: '#059669',      // emerald-600
        error: '#e11d48',        // rose-600
        warning: '#d97706',      // amber-600
        pending: '#d97706',
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
}
