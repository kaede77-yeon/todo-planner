import type { Config } from "tailwindcss";

// Design tokens: photography-led marketplace style — white canvas, near-black
// ink, a single coral accent used sparingly, soft rounded shapes, and exactly
// one shadow tier.
const FLOAT_SHADOW =
  "rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ff385c",
          active: "#e00b41",
          disabled: "#ffd1da",
        },
        "on-primary": "#ffffff",
        canvas: "#ffffff",
        "surface-soft": "#f7f7f7",
        "surface-strong": "#f2f2f2",
        hairline: "#dddddd",
        "hairline-soft": "#ebebeb",
        "border-strong": "#c1c1c1",
        ink: "#222222",
        body: "#3f3f3f",
        muted: "#6a6a6a",
        "muted-soft": "#929292",
        error: {
          DEFAULT: "#c13515",
          hover: "#b32505",
        },
        scrim: "#000000",
      },
      // Bare `border` gets the hairline tone instead of Tailwind's gray.
      borderColor: {
        DEFAULT: "#dddddd",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Pretendard",
          "-apple-system",
          "system-ui",
          "Malgun Gothic",
          "Apple SD Gothic Neo",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-xl": ["28px", { lineHeight: "1.43", fontWeight: "700" }],
        "display-md": ["21px", { lineHeight: "1.43", fontWeight: "700" }],
        "display-sm": ["20px", { lineHeight: "1.2", letterSpacing: "-0.18px", fontWeight: "600" }],
        "title-md": ["16px", { lineHeight: "1.25", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.5" }],
        "body-sm": ["14px", { lineHeight: "1.43" }],
        caption: ["14px", { lineHeight: "1.29", fontWeight: "500" }],
        badge: ["11px", { lineHeight: "1.18", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "8px", // buttons, inputs
        card: "14px", // cards, panels, modals
        xl: "32px", // category strips
      },
      boxShadow: {
        // The system has a single elevation tier; every shadow utility maps to it.
        float: FLOAT_SHADOW,
        sm: FLOAT_SHADOW,
        DEFAULT: FLOAT_SHADOW,
        md: FLOAT_SHADOW,
        lg: FLOAT_SHADOW,
        xl: FLOAT_SHADOW,
      },
      spacing: {
        section: "64px",
      },
    },
  },
  plugins: [],
};
export default config;
