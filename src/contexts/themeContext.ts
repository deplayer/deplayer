import { createContext, useContext } from 'react'

export const THEMES = [
  "deplayer", "deplayer-light", "light", "dark", "cupcake", "bumblebee", "emerald", 
  "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", 
  "forest", "aqua", "lofi", "fantasy", "black", "luxury", "dracula", "cmyk", "autumn", 
  "business", "acid", "lemonade", "night", "coffee", "winter", "dim", "nord", "sunset", 
  "teenage-engineering", "teenage-engineering-light", "cassette-futurism"
] as const

export type Theme = typeof THEMES[number]

export const DEFAULT_THEME: Theme = 'deplayer'

export type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
})

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextValue => {
  return useContext(ThemeContext)
}
