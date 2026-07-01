/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coal: "#101214",
        panel: "#171a1f",
        line: "#2b313a",
        field: "#20242b",
        accent: "#22c55e",
        amberSoft: "#f59e0b"
      }
    }
  },
  plugins: []
};
