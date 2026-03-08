import { ReactNode } from 'react'
import EmptyStateAction from './EmptyStateAction'

type FallbackStep = {
  condition: boolean
  action: ReactNode
  description?: string
}

type FallbackResult = {
  action: ReactNode
  description?: string
}

/**
 * Resolves the first matching fallback action based on app state.
 *
 * Each consumer provides its own priority list of steps. The first step
 * whose `condition` is true wins. If none match, falls back to the
 * "add a provider" action.
 *
 * Common steps are exported as helpers to avoid re-declaring them.
 */
export const getEmptyStateFallback = (steps: FallbackStep[]): FallbackResult => {
  for (const step of steps) {
    if (step.condition) {
      return { action: step.action, description: step.description }
    }
  }

  // Terminal fallback: no providers configured
  return {
    action: <EmptyStateAction to="/settings" icon="faPlug" label="message.addProvider" />,
    description: 'message.addSearchableProvider',
  }
}

// ── Pre-built steps consumers can pick from ──────────────────────────

export const collectionStep = (hasCollectionItems: boolean): FallbackStep => ({
  condition: hasCollectionItems,
  action: <EmptyStateAction to="/collection" icon="faDatabase" label="message.jumpToCollection" />,
})

export const searchStep = (hasSearchableProviders: boolean): FallbackStep => ({
  condition: hasSearchableProviders,
  action: <EmptyStateAction to="/search" icon="faSearch" label="message.startSearch" />,
  description: 'message.startSearchingForMusic',
})

export const queueStep = (hasQueueItems: boolean): FallbackStep => ({
  condition: hasQueueItems,
  action: <EmptyStateAction to="/queue" icon="faMusic" label="message.goToQueue" />,
})
