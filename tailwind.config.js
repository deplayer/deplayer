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
        deplayer: {
          "primary": "#2073c2",
          "primary-content": "#ffffff",
          "secondary": "#fefe54",
          "secondary-content": "#000000",
          "accent": "#cbd5e0",
          "neutral": "#101b26",
          "base-100": "#0e1b1e",
          "base-200": "#101b26",
          "base-300": "#1a2b3c",
          "base-content": "#bee3f8",
          "info": "#2073c2",
          "success": "#008000",
          "warning": "#ffff00",
          "error": "#dc3545",
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
      },
      "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
      "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
      "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
      "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
      "winter", "dim", "nord", "sunset"
    ],
  },
}

