/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: "#1E293B",
        primary: "#3B82F6",
        success: "#22C55E",
        error: "#EF4444",
        text: "#F8FAFC",
        muted: "#94A3B8",
      },
    },
  },
  plugins: [],
};
