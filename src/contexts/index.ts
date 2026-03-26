/**
 * Contexts - Ephemeral State Management
 * 
 * This module exports React Context providers and hooks for managing
 * local, ephemeral state that doesn't need to persist or sync.
 * 
 * For persistent, synced state, use LiveStore queries and events.
 */

export { ThemeProvider, useTheme, THEMES, type Theme } from './ThemeContext'
