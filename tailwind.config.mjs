/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Light backgrounds with dark text (#434343)
        light: {
          nude: "#FBD8C9",    // Scallop Shell
          cream: "#EFE1CE",   // Buttercream
          leaf: "#E0E6D6",    // Whisper Green
          wave: "#D2E8DF",    // Aqua Glass
          ice: "#E2EAEB",     // Bit of Blue
          peach: "#FED1BD",   // Pale Peach
          blush: "#F6DBD8",   // Rosewater
          petal: "#F4E1E6",   // Shrinking Violet
          fog: "#DBD2DB",     // Orchid Tint
        },
        // Light backgrounds with darker text (#030303)
        bright: {
          pink: "#F5B0BD",    // Candy Pink
          orchid: "#D198C5",  // Orchid
          prism: "#F0A1BF",   // Prism Pink
          cherry: "#F7CFE1",  // Cherry Blossom
          ocean: "#BFD5EB",   // Ice Water
        },
        // Dark backgrounds with white text (#FEFEFE)
        dark: {
          boulevard: "#575358",  // Boulevard
          cypress: "#545A3E",    // Crypress
          cabernet: "#64242E",   // Cabernet
          persian: "#A21441",    // Persian Red
          quartz: "#274374",     // Blue Quartz
        },
        // Text colors
        text: {
          dark: "#434343",     // For light backgrounds
          darker: "#030303",   // For bright backgrounds
          light: "#FEFEFE",    // For dark backgrounds
        },
      },
    },
  },
  plugins: [],
};
