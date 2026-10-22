import { useAppStore } from '../store'
import { queryDb, Schema } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'

/**
 * Metadata Hooks — Bounded DISTINCT queries for filter/facet data.
 */

const ValueRowSchema = Schema.Array(
  Schema.Struct({ value: Schema.String }),
)

const availableGenresQuery = queryDb(
  {
    query: `SELECT DISTINCT TRIM(genre) AS value FROM media_genres WHERE LENGTH(TRIM(genre)) > 0 ORDER BY value ASC`,
    schema: ValueRowSchema,
  },
  { label: 'collection.availableGenres' },
)

const availableProvidersQuery = queryDb(
  {
    query: `SELECT DISTINCT providersFlat AS value FROM media WHERE providersFlat <> '' ORDER BY value ASC`,
    schema: ValueRowSchema,
  },
  { label: 'collection.availableProviders' },
)

const availableTypesQuery = queryDb(
  {
    query: `SELECT DISTINCT TRIM(type) AS value FROM media WHERE LENGTH(TRIM(type)) > 0 ORDER BY value ASC`,
    schema: ValueRowSchema,
  },
  { label: 'collection.availableTypes' },
)

export const useAvailableGenres = (): string[] => {
  const store = useAppStore()
  const result = store.useQuery(availableGenresQuery)

  return useMemo(() => {
    if (!Array.isArray(result)) return []
    const seen = new Set<string>()
    const values: string[] = []
    for (const row of result) {
      const v = typeof row?.value === 'string' ? row.value.trim() : ''
      if (v.length > 0 && !seen.has(v)) {
        seen.add(v)
        values.push(v)
      }
    }
    return values.sort()
  }, [result])
}

export const useAvailableProviders = (): string[] => {
  const store = useAppStore()
  const result = store.useQuery(availableProvidersQuery)

  return useMemo(() => {
    if (!Array.isArray(result)) return []
    const names = new Set<string>()
    for (const row of result) {
      if (typeof row?.value !== 'string' || row.value === '') continue
      for (const name of row.value.split(',')) {
        const trimmed = name.trim()
        if (trimmed) names.add(trimmed)
      }
    }
    return Array.from(names).sort()
  }, [result])
}

export const useAvailableTypes = (): string[] => {
  const store = useAppStore()
  const result = store.useQuery(availableTypesQuery)

  return useMemo(() => {
    if (!Array.isArray(result)) return []
    const seen = new Set<string>()
    const values: string[] = []
    for (const row of result) {
      const v = typeof row?.value === 'string' ? row.value.trim() : ''
      if (v.length > 0 && !seen.has(v)) {
        seen.add(v)
        values.push(v)
      }
    }
    return values.sort()
  }, [result])
}

export const useMediaCount = (): number => {
  const store = useAppStore()
  return store.useQuery(queryDb(tables.media.count()))
}

export const useArtistsCount = (): number => {
  const store = useAppStore()
  return store.useQuery(queryDb(tables.artists.count()))
}

export const useAlbumsCount = (): number => {
  const store = useAppStore()
  return store.useQuery(queryDb(tables.albums.count()))
}
