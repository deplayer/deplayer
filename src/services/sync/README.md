# Sync Module for Cross-Device Synchronization

This module provides bidirectional cross-device synchronization for the Deplayer application using ElectricSQL's approach with additional customizations for write-path synchronization.

## Architecture Overview

The sync module consists of two main synchronization paths:

1. **Read-path synchronization** - Managed by `SyncManager`, which keeps the local database synchronized with the server by downloading changes as they occur using ElectricSQL's shape subscriptions.

2. **Write-path synchronization** - Managed by `ChangeLogSynchronizer`, which tracks local changes using a "through-the-database" approach with triggers and a change log table, then uploads these changes to the server.

## Core Components

- **SyncManager**: Manages the read-path synchronization with the server, handling authentication, reconnection, and table syncing.
- **ChangeLogSynchronizer**: Monitors the local change log table and sends local changes to the server.
- **Change Log Table**: A PostgreSQL table that tracks all changes to tables that need to be synchronized.
- **Database Triggers**: Automatically track INSERT, UPDATE, and DELETE operations on tables that need to be synchronized.
- **Drizzle Integration**: Database schema and migrations are integrated with Drizzle ORM.

## Database Schema

The sync system adds these database objects:

1. **_electric_change_log table**: Stores changes made to tracked tables
2. **track_table_changes() function**: Trigger function that writes to the change log table
3. **Table-specific triggers**: Added to each table that needs to be synchronized

## Setup

### 1. Database Migration

The sync system requires a migration to set up the change log table and triggers. In your migration files, import and use the `changeLogMigration`:

```typescript
// Example migration file: drizzle/migrations/change-log-migration.ts
import { changeLogMigration } from '../../src/services/sync/migrations';

export const up = changeLogMigration.up;
export const down = changeLogMigration.down;
```

### 2. Application Integration

Initialize the sync infrastructure in your main application setup:

```typescript
import { createSyncInfrastructure, SyncConfig } from './services/sync';
import { PGlite } from '@electric-sql/pglite';

// Get the database client
const dbClient = new PGlite();

// Configure your sync settings
const syncConfig: SyncConfig = {
  serverUrl: 'https://your-server.com/api',
  enabled: true,
  tables: [
    { name: 'media', primaryKey: ['id'] },
    { name: 'playlist', primaryKey: ['id'] },
    // Add other tables to sync
  ],
  authToken: 'user-auth-token'
};

// Initialize the sync infrastructure
const { syncManager, changeLogSynchronizer } = await createSyncInfrastructure(
  dbClient, 
  syncConfig
);

// Listen for sync events
syncManager.on('error', (error) => {
  console.error('Sync error:', error);
});

syncManager.on('connected', () => {
  console.log('Connected to sync server');
});

// Start synchronization
await syncManager.start();
```

## How the Synchronization Works

### Read-Path Synchronization (Server to Local)

1. The `SyncManager` establishes a connection to the server using ElectricSQL.
2. It subscribes to "shapes" (data streams) for each configured table.
3. When changes occur on the server, they are automatically downloaded and applied to the local database.
4. The manager handles authentication, reconnection, and error management.

### Write-Path Synchronization (Local to Server)

1. When changes are made to tables in the local database, triggers automatically insert records into the `_electric_change_log` table.
2. The change log entry includes the table name, row ID, operation type (INSERT/UPDATE/DELETE), and the full row data.
3. The `ChangeLogSynchronizer` monitors the change log table using two mechanisms:
   - PostgreSQL notifications using `pg_notify` for immediate change detection
   - Regular polling as a fallback mechanism (every 10 seconds)
4. When changes are detected, they are batched and sent to the server's `/v1/changes` endpoint.
5. If the server acknowledges the changes, they are marked as synced in the change log.
6. If errors occur, the error is recorded and the changes can be retried later.

## API Reference

### SyncManager

The `SyncManager` class handles read-path synchronization:

```typescript
// Create a new SyncManager
const syncManager = new SyncManager(dbClient, {
  serverUrl: 'https://your-server.com/api',
  enabled: true,
  tables: [{ name: 'media', primaryKey: ['id'] }],
  authToken: 'user-auth-token'
});

// Start synchronization
await syncManager.start();

// Stop synchronization
await syncManager.stop();

// Update configuration
await syncManager.updateConfig({
  enabled: false,
  authToken: 'new-token'
});

// Listen for events
syncManager.on('connected', (data) => {
  console.log('Connected to server:', data);
});

// Remove event listener
syncManager.off('connected', myCallback);

// Get current status
const status = syncManager.getStatus();
```

### ChangeLogSynchronizer

The `ChangeLogSynchronizer` class handles write-path synchronization:

```typescript
// Create a new ChangeLogSynchronizer
const synchronizer = new ChangeLogSynchronizer(dbClient, { 
  batchSize: 50
});

// Start the synchronizer
await synchronizer.start();

// Stop the synchronizer
await synchronizer.stop();

// Manually sync a specific row (for critical changes)
await synchronizer.syncRow('media', 'row-123');
```

### Utility Functions

```typescript
// Create both SyncManager and ChangeLogSynchronizer
const { syncManager, changeLogSynchronizer } = await createSyncInfrastructure(
  dbClient, syncConfig
);

// Setup the change log schema
await setupLocalSyncSchema(dbClient);

// Initialize the change log synchronizer
const synchronizer = await initializeChangeLogSync(dbClient);

// Get the global SyncManager instance
const syncManager = getSyncManager();

// Set the global SyncManager instance
setSyncManager(syncManager);

// Clear the global SyncManager instance
clearSyncManager();
```

## Server-Side API Requirements

The sync system expects the server to provide these endpoints:

1. `/v1/shape` - For shape subscriptions (read-path synchronization)
2. `/v1/changes` - For submitting local changes (write-path synchronization)

The server should handle authentication using Bearer tokens in the Authorization header.

## Error Handling and Recovery

- **Reconnection**: If the connection to the server is lost, the system attempts to reconnect automatically.
- **Change Tracking**: Failed synchronizations are tracked in the change log table with error messages.
- **Rollback Support**: The server can instruct the client to roll back changes if needed.
- **Critical Tables**: Tables can be marked as critical, causing sync errors to be re-thrown rather than just logged.

## Testing

When testing the sync system:

1. Use the `clearSyncManager` function to reset the global sync manager between tests.
2. You can inject mock clients for both PGlite and API calls to test synchronization logic.
3. To test only one direction of synchronization, you can initialize just the SyncManager or ChangeLogSynchronizer.

## Performance Considerations

- Changes are batched to minimize API calls
- Indices on the change log table optimize query performance
- PostgreSQL notifications provide real-time change detection without polling overhead
- Regular polling is used as a fallback mechanism

## Security

- All API calls include authentication tokens
- The system depends on HTTPS for secure transport
- No sensitive data is stored in the change log beyond what's in the regular tables

## Customization

You can customize the sync system by modifying:

- `migrations.ts`: Define which tables should be tracked for synchronization
- `local-schema.sql.ts`: Change the structure of the change log table and triggers
- `SyncManager.ts`: Adjust the read-path synchronization behavior
- `ChangeLogSynchronizer.ts`: Modify the write-path synchronization behavior and retry strategies 