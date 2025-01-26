/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'deplayer-dark': '#101b26',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [
    require('daisyui') 
  ],
  daisyui: {
    themes: [
      {
        "deplayer-light": {
          "primary": "#0284c7",
          "secondary": "#fef08a",
          "accent": "#e2e8f0",
          "neutral": "#1e293b",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          "base-content": "#0f172a",
          "info": "#0ea5e9",
          "success": "#22c55e",
          "warning": "#eab308",
          "error": "#ef4444",
          "--rounded-box": "0.25rem",
          "--rounded-btn": "0.25rem",
          "--rounded-badge": "0.25rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.25rem",
        },
        "deplayer": {
          "primary": "#0ea5e9",
          "secondary": "#eab308",
          "accent": "#cbd5e0",
          "neutral": "#000000",
          "base-100": "#101b26",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#bae6fd",
          "info": "#0ea5e9",
          "success": "#22c55e",
          "warning": "#eab308",
          "error": "#ef4444",
          "--rounded-box": "0.25rem",
          "--rounded-btn": "0.25rem",
          "--rounded-badge": "0.25rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.25rem",
        },
        "teenage-engineering": {
          "primary": "#FF5B00",     // TE signature orange
          "secondary": "#FFDB00",    // TE yellow accent
          "accent": "#00C2FF",       // TE blue accent
          "neutral": "#1A1A1A",      // Dark gray for neutral elements
          "base-100": "#000000",     // Pure black background
          "base-200": "#0D0D0D",     // Slightly lighter black
          "base-300": "#1A1A1A",     // Dark gray for elevated elements
          "base-content": "#FFFFFF", // White text
          "info": "#00C2FF",         // Blue for info
          "success": "#00FF66",      // Bright green for success
          "warning": "#FFDB00",      // Yellow for warnings
          "error": "#FF0033",        // Red for errors
          "--rounded-box": "0.125rem",    // Minimal rounded corners
          "--rounded-btn": "0.125rem",    // Minimal rounded corners
          "--rounded-badge": "0.125rem",  // Minimal rounded corners
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.98",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.125rem"
        },
        "teenage-engineering-light": {
          "primary": "#FF5B00",     // TE signature orange
          "secondary": "#FFDB00",    // TE yellow accent
          "accent": "#00C2FF",       // TE blue accent
          "neutral": "#E5E5E5",      // Light gray for neutral elements
          "base-100": "#FFFFFF",     // Pure white background
          "base-200": "#F5F5F5",     // Very light gray
          "base-300": "#E5E5E5",     // Light gray for elevated elements
          "base-content": "#000000", // Black text
          "info": "#00C2FF",         // Blue for info
          "success": "#00D455",      // Slightly muted green for better contrast
          "warning": "#FFDB00",      // Yellow for warnings
          "error": "#FF0033",        // Red for errors
          "--rounded-box": "0.125rem",    // Minimal rounded corners
          "--rounded-btn": "0.125rem",    // Minimal rounded corners
          "--rounded-badge": "0.125rem",  // Minimal rounded corners
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.98",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.125rem"
        },
      },
      "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
      "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
      "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
      "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
      "winter", "dim", "nord", "sunset"
    ],
  },
}

