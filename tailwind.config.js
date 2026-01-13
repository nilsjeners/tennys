/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: "#3fd8e5",
          lime: "#a3e635",
          clay: "#f97316"
        },
        ink: {
          primary: "#0f172a",
          muted: "#475569"
        },
        surface: {
          base: "#f5f1e9",
          raised: "#f0e9df",
          muted: "#e2d8c8"
        }
      },
      boxShadow: {
        soft: "0 24px 60px rgba(12, 18, 32, 0.16)",
        strong: "0 16px 30px rgba(15, 23, 42, 0.18)"
      },
      borderRadius: {
        brand: "14px"
      },
      fontFamily: {
        sans: [
          "var(--font-text)",
          "Barlow Semi Condensed",
          "system-ui",
          "sans-serif"
        ],
        condensed: [
          "var(--font-numbers)",
          "Barlow Condensed",
          "system-ui",
          "sans-serif"
        ]
      },
      keyframes: {
        heroIn: {
          "0%": { opacity: "0", transform: "translateY(-18px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        heroIn: "heroIn 700ms ease-out both",
        fadeUp: "fadeUp 800ms ease-out both"
      }
    }
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        tennys: {
          primary: "#3fd8e5",
          "primary-content": "#04121d",
          secondary: "#a3e635",
          "secondary-content": "#1f2a10",
          accent: "#f97316",
          "accent-content": "#2b1408",
          neutral: "#0c1220",
          "neutral-content": "#f8fafc",
          "base-100": "#f5f1e9",
          "base-200": "#ebe5dc",
          "base-300": "#e2d8c8",
          "base-content": "#0f172a",
          info: "#38bdf8",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444"
        }
      }
    ]
  }
};
