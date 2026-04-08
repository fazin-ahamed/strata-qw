export interface ConnectorConfig {
  id: string;
  type: 'email' | 'calendar' | 'crm' | 'meeting' | 'finance';
  provider: 'gmail' | 'outlook' | 'salesforce' | 'zoom' | 'stripe';
  credentials: Record<string, any>;
  syncInterval?: number; // seconds
}

export interface SyncResult {
  connectorId: string;
  entitiesCreated: number;
  eventsCreated: number;
  errors: string[];
  lastSyncedAt: Date;
}

export abstract class BaseConnector {
  constructor(protected config: ConnectorConfig) {}

  abstract authenticate(): Promise<boolean>;
  abstract sync(): Promise<SyncResult>;
  abstract push?(entity: any): Promise<void>;
  
  protected async logSync(result: SyncResult) {
    console.log(`[Connector:${this.config.id}] Synced ${result.entitiesCreated} entities, ${result.eventsCreated} events`);
  }
}
