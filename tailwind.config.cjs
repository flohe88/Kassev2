/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pos': {
          'primary': '#ffffff',      // Weißer Hintergrund
          'secondary': '#f8fafc',    // Sehr helles Grau für Karten
          'accent': '#3b82f6',       // Helles Blau für Akzente
          'success': '#22c55e',      // Frisches Grün
          'warning': '#f59e0b',      // Warmes Orange
          'danger': '#ef4444',       // Helles Rot
          'text': '#1e293b',         // Dunkles Blaugrau für Text
          'muted': '#64748b',        // Mittleres Grau für sekundären Text
          'border': '#e2e8f0',       // Helles Grau für Ränder
          'hover': '#f1f5f9'         // Sehr helles Grau für Hover-Effekte
        }
      },
      boxShadow: {
        'pos': '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
} 