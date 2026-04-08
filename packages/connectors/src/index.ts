// Connector framework for Strata platform

export interface ConnectorConfig {
  id: string;
  name: string;
  type: ConnectorType;
  credentials: Record<string, string>;
  syncInterval?: number; // milliseconds
  enabled: boolean;
}

export type ConnectorType =
  | 'calendar'
  | 'email'
  | 'crm'
  | 'accounting'
  | 'banking'
  | 'project-management'
  | 'communication'
  | 'storage'
  | 'hr';

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  errors: SyncError[];
  lastSyncAt: Date;
}

export interface SyncError {
  item_id?: string;
  message: string;
  code: string;
}

export abstract class BaseConnector {
  constructor(protected config: ConnectorConfig) {}

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sync(): Promise<SyncResult>;
  abstract testConnection(): Promise<boolean>;

  protected async validateCredentials(): Promise<boolean> {
    return true;
  }
}

// Calendar Connector
export class CalendarConnector extends BaseConnector {
  async connect(): Promise<void> {
    // Implement calendar connection
  }

  async disconnect(): Promise<void> {
    // Implement disconnection
  }

  async sync(): Promise<SyncResult> {
    return {
      success: true,
      itemsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return [];
  }
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  meetingUrl?: string;
  isRecurring: boolean;
}

// Email Connector
export class EmailConnector extends BaseConnector {
  async connect(): Promise<void> {
    // Implement email connection
  }

  async disconnect(): Promise<void> {
    // Implement disconnection
  }

  async sync(): Promise<SyncResult> {
    return {
      success: true,
      itemsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getEmails(since: Date): Promise<EmailMessage[]> {
    return [];
  }
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  htmlBody?: string;
  receivedAt: Date;
  hasAttachments: boolean;
  threadId?: string;
}

// CRM Connector
export class CRMConnector extends BaseConnector {
  async connect(): Promise<void> {
    // Implement CRM connection
  }

  async disconnect(): Promise<void> {
    // Implement disconnection
  }

  async sync(): Promise<SyncResult> {
    return {
      success: true,
      itemsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getContacts(): Promise<Contact[]> {
    return [];
  }

  async getDeals(): Promise<Deal[]> {
    return [];
  }
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags: string[];
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  closeDate?: Date;
  contactId: string;
}

// Banking Connector
export class BankingConnector extends BaseConnector {
  async connect(): Promise<void> {
    // Implement banking connection
  }

  async disconnect(): Promise<void> {
    // Implement disconnection
  }

  async sync(): Promise<SyncResult> {
    return {
      success: true,
      itemsSynced: 0,
      errors: [],
      lastSyncAt: new Date(),
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getTransactions(since: Date): Promise<Transaction[]> {
    return [];
  }

  async getAccounts(): Promise<Account[]> {
    return [];
  }
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  category?: string;
  merchant?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
}

// Connector Registry
export class ConnectorRegistry {
  private connectors: Map<string, BaseConnector> = new Map();

  register(connector: BaseConnector): void {
    this.connectors.set(connector.config.id, connector);
  }

  get(id: string): BaseConnector | undefined {
    return this.connectors.get(id);
  }

  getAll(): BaseConnector[] {
    return Array.from(this.connectors.values());
  }

  async syncAll(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (const connector of this.connectors.values()) {
      if (connector.config.enabled) {
        results.push(await connector.sync());
      }
    }
    return results;
  }
}
