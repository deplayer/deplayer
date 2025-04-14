import { PGlite } from "@electric-sql/pglite";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import { createLogger } from "../../utils/logger";

// Define the event types for the sync manager
type SyncEvent = 
  | 'error'
  | 'connected'
  | 'disconnected'
  | 'tableSync'  // Emitted when a table sync completes
  | 'authenticated'
  | 'authenticationFailed';

type SyncEventCallback = (data: unknown) => void;

type ShapeRows = Record<string, any>[];

type ShapeData = {
  rows: ShapeRows;
} | undefined;

type ShapeSubscription = {
  rows: Promise<ShapeRows>;
  subscribe: (callback: (data: ShapeData) => void) => void;
};

export type TableSync = {
  name: string;
  primaryKey: string[];
  critical?: boolean; // If true, sync errors will be re-thrown
};

export type SyncConfig = {
  serverUrl: string;
  tables: TableSync[];
  enabled: boolean;
  // Authentication token
  authToken?: string;
  // Reconnect settings
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
};

export type ExtendedPGlite = PGlite | PGliteWorker & {
  electric: {
    syncShapeToTable: (config: {
      shape: {
        url: string;
        params: {
          table: string;
        };
        headers?: Record<string, string>;
      };
      table: string;
      primaryKey: string[];
    }) => ShapeSubscription;
  };
};

export class SyncManager {
  private client: ExtendedPGlite;
  private config: SyncConfig;
  private logger = createLogger({ namespace: "SyncManager" });
  private eventListeners: Map<SyncEvent, SyncEventCallback[]> = new Map();
  private subscriptions: Map<string, ShapeSubscription> = new Map();
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(client: ExtendedPGlite, config: SyncConfig) {
    this.client = client;
    this.config = {
      ...config,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5
    };
    
    // Initialize event listeners map
    ['error', 'connected', 'disconnected', 'tableSync', 'authenticated', 'authenticationFailed'].forEach(
      (event) => this.eventListeners.set(event as SyncEvent, [])
    );
  }

  /**
   * Start the synchronization process
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info("Sync is disabled, not starting");
      return;
    }

    if (!this.config.serverUrl) {
      this.logger.warn("No server URL provided, cannot start sync");
      this.emit('error', new Error("No server URL provided"));
      return;
    }

    try {
      this.logger.info(`Starting sync with server: ${this.config.serverUrl}`);
      await this.syncTables();
      this.connected = true;
      this.emit('connected', { serverUrl: this.config.serverUrl });
    } catch (error) {
      this.logger.error("Error starting sync:", error);
      this.emit('error', error);
      this.attemptReconnect();
    }
  }

  /**
   * Stop the synchronization process
   */
  async stop(): Promise<void> {
    this.logger.info("Stopping sync");
    this.connected = false;
    
    // Clear reconnect timer if exists
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Can add disconnect logic here when ElectricSQL provides it
    this.emit('disconnected', {});
  }

  /**
   * Update the sync configuration
   */
  async updateConfig(newConfig: Partial<SyncConfig>): Promise<void> {
    const prevEnabled = this.config.enabled;
    const prevServerUrl = this.config.serverUrl;
    
    this.config = {
      ...this.config,
      ...newConfig
    };

    // Handle auth token update
    if (newConfig.authToken && newConfig.authToken !== this.config.authToken) {
      this.logger.debug("Auth token updated");
    }

    // Restart sync if settings have changed in a way that requires reconnection
    if (
      (prevEnabled !== this.config.enabled && this.config.enabled) ||
      (prevServerUrl !== this.config.serverUrl && this.config.enabled)
    ) {
      await this.stop();
      await this.start();
    }
  }

  /**
   * Register an event listener
   */
  on(event: SyncEvent, callback: SyncEventCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Remove an event listener
   */
  off(event: SyncEvent, callback: SyncEventCallback): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  private emit(event: SyncEvent, data: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        this.logger.error(`Error in ${event} event listener:`, error);
      }
    });
  }

  /**
   * Get sync status
   */
  getStatus(): { connected: boolean; config: SyncConfig } {
    return {
      connected: this.connected,
      config: this.config
    };
  }

  /**
   * Attempt to reconnect to the sync server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      return;
    }

    this.reconnectAttempts++;
    this.logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.start();
        this.reconnectAttempts = 0;
      } catch (error) {
        this.logger.error("Reconnect attempt failed:", error);
        this.emit('error', error);
        this.attemptReconnect();
      }
    }, this.config.reconnectInterval);
  }

  /**
   * Sync all configured tables
   */
  private async syncTables(): Promise<void> {
    if (!this.config.enabled || !this.config.serverUrl) {
      return;
    }

    // Sort tables to respect dependencies
    const sortedTables = this.sortTablesByDependency(this.config.tables);
    this.logger.debug("Syncing tables in order:", sortedTables.map(t => t.name));

    for (const table of sortedTables) {
      try {
        await this.syncTable(table);
      } catch (error) {
        this.logger.error(`Error syncing table ${table.name}:`, error);
        this.emit('error', { table: table.name, error });
        
        // For critical tables, stop the sync process and rethrow
        if (table.critical) {
          throw error;
        }
      }
    }
  }

  /**
   * Sort tables to respect dependencies
   * Tables with foreign keys should come after their referenced tables
   */
  private sortTablesByDependency(tables: TableSync[]): TableSync[] {
    // This is a simplified sorting that assumes the tables array is
    // already in a dependency-respecting order. In a real implementation,
    // you would build a dependency graph and perform topological sort.
    return [...tables];
  }

  /**
   * Sync a single table
   */
  private async syncTable(table: TableSync): Promise<void> {
    this.logger.debug(`Setting up sync for table: ${table.name}`);

    const headers: Record<string, string> = {};
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    // @ts-ignore - We know the client supports this
    const shape = await (this.client as ExtendedPGlite).electric.syncShapeToTable({
      shape: {
        url: `${this.config.serverUrl}/v1/shape`,
        params: {
          table: table.name,
        },
        headers,
      },
      table: table.name,
      primaryKey: table.primaryKey,
    });

    // Wait for initial data
    try {
      const initialRows = await shape.rows;
      this.logger.debug(`Loaded ${initialRows?.length ?? 0} rows for ${table.name}`);
      this.emit('tableSync', { 
        table: table.name, 
        count: initialRows?.length ?? 0 
      });
    } catch (error) {
      this.logger.error(`Error loading initial data for ${table.name}:`, error);
      throw error;
    }

    // Set up subscription
    shape.subscribe((data: ShapeData) => {
      try {
        if (!data) {
          this.logger.warn(`No rows found for ${table.name}`);
          return;
        }

        const rows = data.rows;
        if (!Array.isArray(rows)) {
          this.logger.warn(`Invalid rows data for ${table.name}:`, rows);
          return;
        }

        this.logger.debug(`Updated ${rows.length} rows for ${table.name}`);
        this.emit('tableSync', { 
          table: table.name, 
          count: rows.length,
          updated: true
        });
      } catch (error) {
        this.logger.error(`Error during sync subscription for ${table.name}:`, error);
        this.emit('error', { table: table.name, error });
      }
    });

    // Store the subscription
    this.subscriptions.set(table.name, shape);
  }
} 