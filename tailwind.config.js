/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050A14",
        navy: "#07152B",
        royal: "#0B3D91",
        electric: "#1769FF",
        mist: "#F5F7FA",
        steel: "#8D9AAF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 8px 30px rgba(5, 10, 20, 0.35)",
        glow: "0 0 24px rgba(23, 105, 255, 0.35)",
      },
      animation: {
        "fade-in": "fadeIn .5s ease both",
        "slide-up": "slideUp .5s ease both",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
