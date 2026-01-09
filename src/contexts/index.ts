/**
 * Contexts - Ephemeral State Management
 * 
 * This module exports React Context providers and hooks for managing
 * local, ephemeral state that doesn't need to persist or sync.
 * 
 * For persistent, synced state, use LiveStore queries and events.
 */

export { PlaybackProvider, usePlayback, type PlaybackState, type PlaybackActions } from './PlaybackContext'
export { ThemeProvider, useTheme, THEMES, type Theme } from './ThemeContext'
export { UIProvider, useUI, type UIState, type UIActions } from './UIContext'
