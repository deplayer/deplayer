import { create } from 'zustand'

export type VisualsMode = 'off' | 'ambient' | 'panel'

export type Filter = {
  genres: string[]
  types: string[]
  artists: string[]
  providers: string[]
  favorites: boolean
}

type UIState = {
  // Layout
  sidebarToggled: boolean
  rightPanelToggled: boolean
  mqlMatch: boolean
  heightMqlMatch: boolean
  loading: boolean
  displayMiniQueue: boolean

  // Modals
  showAddMediaModal: boolean

  // Visuals
  showSpectrum: boolean
  showVisuals: boolean
  visualsMode: VisualsMode
  backgroundImage: string
  panelPositionRight: number | null // null = left-anchored; number = right offset from viewport edge
  panelPositionBottom: number

  // App state
  ready: boolean

  // Search & Filters
  activeFilters: Filter
  searchTerm: string
  searchActive: boolean
  searchOpen: boolean
  searchResults: string[]
}

type UIActions = {
  toggleSidebar: (value?: boolean) => void
  toggleRightPanel: (value?: boolean) => void
  setMqlMatch: (value: boolean) => void
  setHeightMqlMatch: (value: boolean) => void
  setLoading: (loading: boolean) => void
  toggleMiniQueue: () => void
  setShowAddMediaModal: (show: boolean) => void
  toggleSpectrum: () => void
  toggleVisuals: () => void
  cycleVisualsMode: () => void
  setVisualsMode: (mode: VisualsMode) => void
  setPanelPosition: (right: number | null, bottom: number) => void
  setBackgroundImage: (url: string) => void
  setReady: (ready: boolean) => void
  setFilter: (filterType: keyof Filter, values: string[] | boolean) => void
  clearFilters: () => void
  setSearchTerm: (term: string) => void
  toggleSearch: () => void
  closeSearch: () => void
  setSearchResults: (ids: string[]) => void
  clearSearch: () => void
}

const emptyFilters: Filter = {
  genres: [],
  types: [],
  artists: [],
  providers: [],
  favorites: false,
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  // Initial state
  sidebarToggled: false,
  rightPanelToggled: false,
  mqlMatch: false,
  heightMqlMatch: false,
  loading: true,
  displayMiniQueue: true,
  showAddMediaModal: false,
  showSpectrum: false,
  showVisuals: false,
  visualsMode: 'off',
  backgroundImage: '',
  panelPositionRight: 12, // matches CSS default (right: 12px); null = left-anchored after drag
  panelPositionBottom: 0, // 0 = neutral, CSS default bottom applies until dragged
  ready: false,
  activeFilters: emptyFilters,
  searchTerm: '',
  searchActive: false,
  searchOpen: false,
  searchResults: [],

  // Actions
  toggleSidebar: (value) =>
    set((s) => ({ sidebarToggled: value !== undefined ? value : !s.sidebarToggled })),
  toggleRightPanel: (value) =>
    set((s) => ({ rightPanelToggled: value !== undefined ? value : !s.rightPanelToggled })),
  setMqlMatch: (value) => set({ mqlMatch: value }),
  setHeightMqlMatch: (value) => set({ heightMqlMatch: value }),
  setLoading: (loading) => set({ loading }),
  toggleMiniQueue: () => set((s) => ({ displayMiniQueue: !s.displayMiniQueue })),
  setShowAddMediaModal: (show) => set({ showAddMediaModal: show }),
  toggleSpectrum: () => set((s) => ({ showSpectrum: !s.showSpectrum })),
  toggleVisuals: () => set((s) => ({ showVisuals: !s.showVisuals })),
  cycleVisualsMode: () =>
    set((s) => {
      const order: VisualsMode[] = ['off', 'ambient', 'panel']
      const next = order[(order.indexOf(s.visualsMode) + 1) % order.length]
      return { visualsMode: next }
    }),
  setVisualsMode: (mode) => set({ visualsMode: mode }),
  setPanelPosition: (right, bottom) =>
    set({ panelPositionRight: right, panelPositionBottom: bottom }),
  setBackgroundImage: (url) => set({ backgroundImage: url }),
  setReady: (ready) => set({ ready }),
  setFilter: (filterType, values) =>
    set((s) => ({ activeFilters: { ...s.activeFilters, [filterType]: values } })),
  clearFilters: () => set({ activeFilters: emptyFilters }),
  setSearchTerm: (term) => set({ searchTerm: term, searchActive: term.trim().length > 0 }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  closeSearch: () => set({ searchOpen: false }),
  setSearchResults: (ids) => set({ searchResults: ids }),
  clearSearch: () =>
    set({ searchTerm: '', searchActive: false, searchResults: [] }),
}))
