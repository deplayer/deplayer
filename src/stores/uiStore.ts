import { create } from 'zustand'

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
  backgroundImage: string

  // App state
  ready: boolean

  // Search & Filters
  activeFilters: Filter
  searchTerm: string
  searchActive: boolean
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
  setBackgroundImage: (url: string) => void
  setReady: (ready: boolean) => void
  setFilter: (filterType: keyof Filter, values: string[] | boolean) => void
  clearFilters: () => void
  setSearchTerm: (term: string) => void
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
  backgroundImage: '',
  ready: false,
  activeFilters: emptyFilters,
  searchTerm: '',
  searchActive: false,

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
  setBackgroundImage: (url) => set({ backgroundImage: url }),
  setReady: (ready) => set({ ready }),
  setFilter: (filterType, values) =>
    set((s) => ({ activeFilters: { ...s.activeFilters, [filterType]: values } })),
  clearFilters: () => set({ activeFilters: emptyFilters }),
  setSearchTerm: (term) => set({ searchTerm: term, searchActive: term.trim().length > 0 }),
  clearSearch: () => set({ searchTerm: '', searchActive: false }),
}))
