import { useState, useCallback, useEffect, ReactNode } from 'react'
import { THEMES, DEFAULT_THEME, ThemeContext, type Theme, type ThemeContextValue } from './themeContext'

/**
 * ThemeContext - UI Theme Management
 * 
 * Manages the application theme (DaisyUI theme names).
 * Theme preference is persisted to localStorage.
 * 
 * Available themes include: deplayer, deplayer-light, light, dark, cupcake, etc.
 * See ThemeModal.tsx for full list.
 */

const THEME_STORAGE_KEY = 'theme'

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
