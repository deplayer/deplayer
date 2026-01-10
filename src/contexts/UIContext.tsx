import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

/**
 * UIContext - Ephemeral UI State
 * 
 * Manages transient UI state that doesn't need to persist:
 * - Modal visibility
 * - Sidebar/panel toggles
 * - Loading states
 * - Form inputs
 * - Media query matches
 * - Visual effects (spectrum, visuals)
 * - Active filters
 * 
 * This state is local-only and not synced.
 */

export type Filter = {
  genres: string[]
  types: string[]
  artists: string[]
  providers: string[]
  favorites: boolean
}

export type UIState = {
  // Panels
  sidebarToggled: boolean
  rightPanelToggled: boolean
  
  // Modals
  showAddMediaModal: boolean
  
  // Media queries
  mqlMatch: boolean // Width breakpoint
  heightMqlMatch: boolean // Height breakpoint
  
  // Visual effects
  showSpectrum: boolean
  showVisuals: boolean
  
  // Queue display
  displayMiniQueue: boolean
  
  // Background
  backgroundImage: string
  
  // Loading state
  loading: boolean
  
  // App ready state
  ready: boolean
  
  // Active filters
  activeFilters: Filter
}

export type UIActions = {
  // Panels
  toggleSidebar: (value?: boolean) => void
  toggleRightPanel: (value?: boolean) => void
  
  // Modals
  setShowAddMediaModal: (show: boolean) => void
  
  // Media queries
  setMqlMatch: (value: boolean) => void
  setHeightMqlMatch: (value: boolean) => void
  
  // Visual effects
  toggleSpectrum: () => void
  toggleVisuals: () => void
  
  // Queue display
  toggleMiniQueue: () => void
  
  // Background
  setBackgroundImage: (url: string) => void
  
  // Loading state
  setLoading: (loading: boolean) => void
  
  // App ready state
  setReady: (ready: boolean) => void
  
  // Filters
  setFilter: (filterType: keyof Filter, values: string[] | boolean) => void
  clearFilters: () => void
}

type UIContextValue = UIState & UIActions

const UIContext = createContext<UIContextValue | undefined>(undefined)

const initialState: UIState = {
  sidebarToggled: false,
  rightPanelToggled: false,
  showAddMediaModal: false,
  mqlMatch: false,
  heightMqlMatch: false,
  showSpectrum: false,
  showVisuals: false,
  displayMiniQueue: true,
  backgroundImage: '',
  loading: true,
  ready: false,
  activeFilters: {
    genres: [],
    types: [],
    artists: [],
    providers: [],
    favorites: false,
  },
}

type Props = {
  children: ReactNode
}

export const UIProvider = ({ children }: Props) => {
  const [state, setState] = useState<UIState>(initialState)

  // Panels
  const toggleSidebar = useCallback((value?: boolean) => {
    setState(prev => ({
      ...prev,
      sidebarToggled: value !== undefined ? value : !prev.sidebarToggled,
    }))
  }, [])

  const toggleRightPanel = useCallback((value?: boolean) => {
    setState(prev => ({
      ...prev,
      rightPanelToggled: value !== undefined ? value : !prev.rightPanelToggled,
    }))
  }, [])

  // Modals
  const setShowAddMediaModal = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showAddMediaModal: show }))
  }, [])

  // Media queries
  const setMqlMatch = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, mqlMatch: value }))
  }, [])

  const setHeightMqlMatch = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, heightMqlMatch: value }))
  }, [])

  // Visual effects
  const toggleSpectrum = useCallback(() => {
    setState(prev => ({ ...prev, showSpectrum: !prev.showSpectrum }))
  }, [])

  const toggleVisuals = useCallback(() => {
    setState(prev => ({ ...prev, showVisuals: !prev.showVisuals }))
  }, [])

  // Queue display
  const toggleMiniQueue = useCallback(() => {
    setState(prev => ({ ...prev, displayMiniQueue: !prev.displayMiniQueue }))
  }, [])

  // Background
  const setBackgroundImage = useCallback((url: string) => {
    setState(prev => ({ ...prev, backgroundImage: url }))
  }, [])

  // Loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  // App ready state
  const setReady = useCallback((ready: boolean) => {
    setState(prev => ({ ...prev, ready }))
  }, [])

  // Filters
  const setFilter = useCallback((filterType: keyof Filter, values: string[] | boolean) => {
    setState(prev => ({
      ...prev,
      activeFilters: {
        ...prev.activeFilters,
        [filterType]: values,
      },
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeFilters: {
        genres: [],
        types: [],
        artists: [],
        providers: [],
        favorites: false,
      },
    }))
  }, [])

  const value: UIContextValue = {
    ...state,
    toggleSidebar,
    toggleRightPanel,
    setShowAddMediaModal,
    setMqlMatch,
    setHeightMqlMatch,
    toggleSpectrum,
    toggleVisuals,
    toggleMiniQueue,
    setBackgroundImage,
    setLoading,
    setReady,
    setFilter,
    clearFilters,
  }

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

/**
 * Hook to access UI context
 * @throws Error if used outside UIProvider
 */
export const useUI = (): UIContextValue => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
