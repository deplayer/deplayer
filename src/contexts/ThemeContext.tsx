import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

/**
 * ThemeContext - UI Theme Management
 * 
 * Manages the application theme (DaisyUI theme names).
 * Theme preference is persisted to localStorage.
 * 
 * Available themes include: deplayer, deplayer-light, light, dark, cupcake, etc.
 * See ThemeModal.tsx for full list.
 */

export const THEMES = [
  "deplayer", "deplayer-light", "light", "dark", "cupcake", "bumblebee", "emerald", 
  "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", 
  "forest", "aqua", "lofi", "fantasy", "black", "luxury", "dracula", "cmyk", "autumn", 
  "business", "acid", "lemonade", "night", "coffee", "winter", "dim", "nord", "sunset", 
  "teenage-engineering", "teenage-engineering-light", "cassette-futurism"
] as const

export type Theme = typeof THEMES[number]

const DEFAULT_THEME: Theme = 'deplayer'
const THEME_STORAGE_KEY = 'theme'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

export const ThemeProvider = ({ children }: Props) => {
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && THEMES.includes(stored as Theme)) {
      return stored as Theme
    }
    return DEFAULT_THEME
  })

  // Apply theme to document on mount and when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [])

  const value: ThemeContextValue = {
    theme,
    setTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
