import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "deplayer-dark": "#101b26",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        "deplayer-light": {
          primary: "#0284c7",
          secondary: "#fef08a",
          accent: "#e2e8f0",
          neutral: "#1e293b",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          "base-content": "#0f172a",
          info: "#0ea5e9",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          "--rounded-box": "0.25rem",
          "--rounded-btn": "0.25rem",
          "--rounded-badge": "0.25rem",
          "--player-btn-radius": "9999px", // Full rounded for player buttons
          "--player-btn-border": "none", // No border for player buttons
          "--player-screen-bg": "rgba(0, 0, 0, 0.2)",
          "--player-screen-radius": "1px",
          "--player-screen-border": "0px",
          "--player-screen-shadow": "0 0 2px rgba(0, 0, 0, 0.5)",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.25rem",
        },
        deplayer: {
          primary: "#0ea5e9",
          secondary: "#eab308",
          accent: "#cbd5e0",
          neutral: "#000000",
          "base-100": "#101b26",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#bae6fd",
          info: "#0ea5e9",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          "--rounded-box": "0.25rem",
          "--rounded-btn": "0.25rem",
          "--rounded-badge": "0.25rem",
          "--player-btn-radius": "9999px", // Full rounded for player buttons
          "--player-btn-border": "none", // No border for player buttons
          "--player-screen-bg": "rgba(0, 0, 0, 0.2)",
          "--player-screen-radius": "10px",
          "--player-screen-border": "0px",
          "--player-screen-shadow": "0 0 10px rgba(0, 0, 0, 0.5)",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.25rem",
        },
        "teenage-engineering": {
          primary: "#FF5B00", // TE signature orange
          secondary: "#FFDB00", // TE yellow accent
          accent: "#00C2FF", // TE blue accent
          neutral: "#262626", // IBM-like dark gray
          "base-100": "#1A1A1A", // Dark charcoal background
          "base-200": "#262626", // IBM terminal gray
          "base-300": "#404040", // Classic computer gray
          "base-content": "#E5E5E5", // Light gray text for contrast
          info: "#00C2FF", // Blue for info
          success: "#00FF66", // Bright green for success
          warning: "#FFDB00", // Yellow for warnings
          error: "#FF0033", // Red for errors
          "--player-bg": "#262626", // Solid background for player controls
          "--player-control-bg": "#333333", // Slightly lighter background for controls
          "--player-btn-radius": "3px", // Square player buttons
          "--player-btn-inner-radius": "9999px", // Square player buttons
          "--player-btn-border": "2px solid #404040", // Visible button borders
          "--player-screen-bg": "rgba(0, 0, 0, 0.2)",
          "--player-screen-radius": "2px",
          "--player-screen-border": "0px",
          "--player-screen-shadow": "0 0 2px rgba(0, 0, 0, 0.2)",
          "--btn-text-case": "uppercase", // Uppercase text for buttons
          "--btn-text-color": "#FFFFFF", // White text for all buttons
          "--rounded-box": "0", // Sharp corners like old IBM terminals
          "--rounded-btn": "0", // Sharp corners
          "--rounded-badge": "0", // Sharp corners
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.98",
          "--border-btn": "2px", // Thicker borders like old terminals
          "--tab-border": "2px", // Thicker borders
          "--tab-radius": "0", // Sharp corners
        },
        "teenage-engineering-light": {
          primary: "#FF5B00", // TE signature orange
          secondary: "#FFDB00", // TE yellow accent
          accent: "#00C2FF", // TE blue accent
          neutral: "#808080", // Classic IBM medium gray
          "base-100": "#D4D4D4", // Light IBM gray background
          "base-200": "#BFBFBF", // Medium-light terminal gray
          "base-300": "#A6A6A6", // Darker accent gray
          "base-content": "#262626", // Dark gray text
          info: "#00C2FF", // Blue for info
          success: "#00D455", // Slightly muted green
          warning: "#FFDB00", // Yellow for warnings
          error: "#FF0033", // Red for errors
          "--player-bg": "#BFBFBF", // Solid medium gray for player
          "--player-control-bg": "#A6A6A6", // Darker gray for controls
          "--player-btn-radius": "3px", // Square player buttons
          "--player-btn-border": "1px solid #8C8C8C", // Visible button borders
          "--player-screen-bg": "rgba(0, 0, 0, 0.5)",
          "--player-screen-radius": "2px",
          "--player-screen-border": "0px",
          "--player-screen-shadow": "0 0 2px rgba(0, 0, 0, 0.2)",
          "--btn-text-case": "uppercase", // Uppercase text for buttons
          "--btn-text-color": "#FFFFFF", // White text for all buttons
          "--rounded-box": "0", // Sharp corners like old IBM terminals
          "--rounded-btn": "0", // Sharp corners
          "--rounded-badge": "0", // Sharp corners
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.98",
          "--border-btn": "2px", // Thicker borders like old terminals
          "--tab-border": "2px", // Thicker borders
          "--tab-radius": "0", // Sharp corners
        },
        "cassette-futurism": {
          primary: "#FF3D00", // Vibrant orange like cassette player buttons
          secondary: "#00E5FF", // Cyan like LED displays
          accent: "#FFD600", // Yellow like cassette tape
          neutral: "#1A1A1A", // Dark background
          "base-100": "#2D2D2D", // Slightly lighter background
          "base-200": "#3D3D3D", // Control panel background
          "base-300": "#4D4D4D", // Button background
          "base-content": "#E0E0E0", // Light text for contrast
          info: "#00E5FF", // Cyan for info
          success: "#00FF00", // Bright green for success
          warning: "#FFD600", // Yellow for warnings
          error: "#FF0000", // Red for errors
          "--player-bg": "#1A1A1A", // Dark background for player
          "--player-control-bg": "#2D2D2D", // Control panel background
          "--player-btn-radius": "4px", // Slightly rounded buttons
          "--player-btn-inner-radius": "2px", // Inner button radius
          "--player-btn-border": "1px solid #4D4D4D", // Subtle button borders
          "--player-screen-bg": "rgba(0, 0, 0, 0.8)", // Dark screen background
          "--player-screen-radius": "4px", // Slightly rounded screen
          "--player-screen-border": "1px solid #4D4D4D", // Subtle screen border
          "--player-screen-shadow": "0 0 10px rgba(0, 229, 255, 0.2)", // Cyan glow
          "--btn-text-case": "uppercase", // Uppercase text for buttons
          "--btn-text-color": "#FFFFFF", // White text for buttons
          "--rounded-box": "4px", // Slightly rounded corners
          "--rounded-btn": "4px", // Slightly rounded buttons
          "--rounded-badge": "4px", // Slightly rounded badges
          "--animation-btn": "0.2s", // Quick button animations
          "--animation-input": "0.2s", // Quick input animations
          "--btn-focus-scale": "0.98", // Subtle button press effect
          "--border-btn": "1px", // Thin borders
          "--tab-border": "1px", // Thin tab borders
          "--tab-radius": "4px", // Slightly rounded tabs
        },
      },
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "fantasy",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
    ],
  },
} satisfies Config;
