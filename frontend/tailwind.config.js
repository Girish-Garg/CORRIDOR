export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e13",
        bg2: "#10141b",
        panel: "#131922",
        panel2: "#171e28",
        line: "#232b38",
        linebright: "#2e3947",
        ink: "#eef2f7",
        dim: "#95a1b2",
        faint: "#5c6675",
        amber: "#f4a32b",
        amberbright: "#ffb43d",
        risk: "#f0503c",
        cyan: "#36cfc0",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "sans-serif"],
        sans: ['"IBM Plex Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
}
