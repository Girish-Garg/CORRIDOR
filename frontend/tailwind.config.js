export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        surface: "#111013",
        surface2: "#16151a",
        line: "#232227",
        line2: "#2e2d33",
        fg: "#ededec",
        muted: "#a1a1a6",
        faint: "#6b6b71",
        faintest: "#47474d",
        accent: "#e8913c",
      },
      fontFamily: {
        sans: ['"Source Serif 4"', "serif"],
        serif: ['"Source Serif 4"', "serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      letterSpacing: {
        tightest: "-0.01em",
      },
    },
  },
  plugins: [],
}
