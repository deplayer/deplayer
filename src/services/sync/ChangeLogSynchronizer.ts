import { PGlite } from "@electric-sql/pglite";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import { createLogger } from "../../utils/logger";
import { getAuthToken } from "../settings/syncSettings";
import { getSyncManager } from "./index";

type ChangeLogEntry = {
  id: number;
  table_name: string;
  row_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  changes: Record<string, any>;
  synced: boolean;
  created_at: Date;
  error?: string;
};

export class ChangeLogSynchronizer {
  private client: PGlite | PGliteWorker;
  private logger = createLogger({ namespace: "ChangeLogSynchronizer" });
  private isRunning = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private notificationListener: any = null;
  private syncBatchSize = 50;

  constructor(client: PGlite | PGliteWorker, options?: { batchSize?: number }) {
    this.client = client;
    if (options?.batchSize) {
      this.syncBatchSize = options.batchSize;
    }
  }

  /**
   * Start the synchronizer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.logger.info("Starting change log synchronizer");

    try {
      // Setup notification listener for real-time change notifications
      // @ts-ignore - PGlite supports LISTEN but TypeScript doesn't know about it
      this.notificationListener = await this.client.listen('electric_changes', (payload: string) => {
        this.logger.debug("Change notification received:", payload);
        this.syncChanges().catch(error => {
          this.logger.error("Error syncing changes after notification:", error);
        });
      });

      // Also set up a polling interval as a fallback
      this.syncInterval = setInterval(() => {
        this.syncChanges().catch(error => {
          this.logger.error("Error syncing changes during interval:", error);
        });
      }, 10000); // Sync every 10 seconds as a fallback

      // Initial sync
      await this.syncChanges();
    } catch (error) {
      this.logger.error("Error starting change log synchronizer:", error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the synchronizer
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info("Stopping change log synchronizer");

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.notificationListener) {
      try {
        // @ts-ignore - PGlite supports unlisten but TypeScript doesn't know about it
        await this.client.unlisten('electric_changes', this.notificationListener);
      } catch (error) {
        this.logger.error("Error unlistening to changes:", error);
      }
      this.notificationListener = null;
    }
  }

  /**
   * Sync pending changes to the server
   */
  async syncChanges(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const syncManager = getSyncManager();
    if (!syncManager || !syncManager.getStatus().connected) {
      this.logger.debug("SyncManager not connected, skipping change sync");
      return;
    }

    try {
      // Get pending changes from change log
      // @ts-ignore - PGlite supports SQL template literals but TypeScript doesn't know about it
      const result = await this.client.sql`
        SELECT * FROM _electric_change_log 
        WHERE synced = false
        ORDER BY created_at ASC
        LIMIT ${this.syncBatchSize}
      `;

      const changes = (result.rows || []) as ChangeLogEntry[];
      if (changes.length === 0) {
        return;
      }

      this.logger.info(`Syncing ${changes.length} pending changes`);

      // Group changes by table for better processing
      const changesByTable: Record<string, ChangeLogEntry[]> = {};
      changes.forEach(change => {
        if (!changesByTable[change.table_name]) {
          changesByTable[change.table_name] = [];
        }
        changesByTable[change.table_name].push(change);
      });

      // Process each table's changes
      for (const [tableName, tableChanges] of Object.entries(changesByTable)) {
        await this.syncTableChanges(tableName, tableChanges);
      }
    } catch (error) {
      this.logger.error("Error syncing changes:", error);
    }
  }

  /**
   * Sync changes for a specific table
   */
  private async syncTableChanges(tableName: string, changes: ChangeLogEntry[]): Promise<void> {
    const syncManager = getSyncManager();
    if (!syncManager) {
      return;
    }

    const config = syncManager.getStatus().config;
    if (!config.serverUrl) {
      return;
    }

    try {
      // Prepare the changes for the API
      const payload = {
        table: tableName,
        changes: changes.map(change => ({
          id: change.id,
          rowId: change.row_id,
          operation: change.operation,
          data: change.changes
        }))
      };

      // Send changes to server
      const response = await fetch(`${config.serverUrl}/v1/changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken() || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      
      // Mark the changes as synced
      const changeIds = changes.map(change => change.id);
      // @ts-ignore - PGlite supports SQL template literals but TypeScript doesn't know about it
      await this.client.sql`
        UPDATE _electric_change_log
        SET synced = true
        WHERE id = ANY(${changeIds})
      `;

      this.logger.info(`Successfully synced ${changes.length} changes for table ${tableName}`);

      // If there were errors reported by the server, update the corresponding entries
      if (result.errors && result.errors.length > 0) {
        for (const error of result.errors) {
          // @ts-ignore - PGlite supports SQL template literals but TypeScript doesn't know about it
          await this.client.sql`
            UPDATE _electric_change_log
            SET error = ${error.message}, synced = false
            WHERE id = ${error.id}
          `;
        }
        
        // Handle rollbacks if needed
        if (result.rollback) {
          await this.handleRollback(tableName, result.rollback);
        }
      }
    } catch (error) {
      this.logger.error(`Error syncing changes for table ${tableName}:`, error);
      // Mark changes as failed
      const changeIds = changes.map(change => change.id);
      const errorMessage = error instanceof Error ? error.message : String(error);
      // @ts-ignore - PGlite supports SQL template literals but TypeScript doesn't know about it
      await this.client.sql`
        UPDATE _electric_change_log
        SET error = ${errorMessage}
        WHERE id = ANY(${changeIds})
      `;
    }
  }

  /**
   * Handle rollback instructions from the server
   */
  private async handleRollback(tableName: string, rollbackData: any): Promise<void> {
    this.logger.warn(`Handling rollback for table ${tableName}:`, rollbackData);
    
    try {
      // Simple strategy: just apply server's version of the data
      if (rollbackData.rows && rollbackData.rows.length > 0) {
        for (const row of rollbackData.rows) {
          const { id, ...data } = row;
          
          // First delete the existing row
          // @ts-ignore
          await this.client.sql`DELETE FROM ${tableName} WHERE id = ${id}`;
          
          // Then insert the server's version if it exists
          if (Object.keys(data).length > 0) {
            const columns = Object.keys(data);
            const values = Object.values(data);
            
            // Dynamically build the INSERT statement
            const columnsStr = columns.join(', ');
            const placeholders = columns.map((_, i) => `$${i+1}`).join(', ');
            
            // @ts-ignore
            await this.client.sql(`INSERT INTO ${tableName} (id, ${columnsStr}) 
              VALUES ($0, ${placeholders})`, [id, ...values]);
          }
        }
        
        this.logger.info(`Applied rollback for ${rollbackData.rows.length} rows in ${tableName}`);
      }
    } catch (error) {
      this.logger.error(`Error applying rollback for ${tableName}:`, error);
      
      // As a last resort, trigger a full resync of the table
      const syncManager = getSyncManager();
      if (syncManager) {
        this.logger.warn(`Triggering full resync of table ${tableName}`);
        // TODO: Implement a method in SyncManager to force refresh of a specific table
      }
    }
  }

  /**
   * Manually sync a specific row change (useful for important changes that shouldn't wait for batch)
   */
  async syncRow(tableName: string, rowId: string): Promise<boolean> {
    if (!this.isRunning) {
      return false;
    }

    try {
      // @ts-ignore
      const result = await this.client.sql`
        SELECT * FROM _electric_change_log 
        WHERE table_name = ${tableName} AND row_id = ${rowId} AND synced = false
        ORDER BY created_at ASC
      `;

      const changes = (result.rows || []) as ChangeLogEntry[];
      if (changes.length === 0) {
        return true; // Nothing to sync
      }

      await this.syncTableChanges(tableName, changes);
      return true;
    } catch (error) {
      this.logger.error(`Error syncing row ${rowId} in table ${tableName}:`, error);
      return false;
    }
  }
} 