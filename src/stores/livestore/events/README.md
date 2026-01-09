# LiveStore Events

This directory contains all event definitions for the LiveStore migration.

## Structure

Events are organized by domain:

- **media.ts** - Media library events (add, update, play, bulk operations)
- **playlist.ts** - Playlist management events
- **queue.ts** - Playback queue events
- **favorites.ts** - Favorites management events
- **lyrics.ts** - Lyrics management events
- **settings.ts** - Application settings events

## Event Naming Convention

All events follow the pattern: `v1.{Domain}{Action}`

Examples:
- `v1.MediaAdded`
- `v1.PlaylistCreated`
- `v1.QueueUpdated`

The `v1` prefix allows for schema evolution in the future.

## Event Design Principles

1. **Command-Based**: Events represent user actions or system commands
2. **Immutable**: Events are append-only and never modified
3. **Normalized on Write**: Media events include embedded artist/album data which gets normalized during materialization
4. **Synced**: All events use `Events.synced()` for eventual cross-device sync support

## Usage

Import events in your components or services:

```typescript
import { mediaEvents } from '@/stores/livestore/events'
import { useStore } from '@livestore/react'

// In a component
const store = useStore()

// Dispatch an event
await store.dispatch(mediaEvents.mediaAdded, {
  id: 'track-123',
  title: 'Song Title',
  artist: { id: 'artist-1', name: 'Artist Name' },
  // ... other fields
})
```

## Next Steps

- [ ] Create materializers in `../materializers/` to map events to SQLite tables
- [ ] Create query hooks in `../queries.ts` for components to subscribe to data
- [ ] Add FTS5 full-text search setup
- [ ] Write tests for event dispatch and materialization
