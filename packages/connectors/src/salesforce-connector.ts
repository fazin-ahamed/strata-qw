import { BaseConnector, ConnectorConfig, SyncResult } from './base-connector';

export interface SalesforceConfig extends ConnectorConfig {
  instanceUrl: string;
  accessToken: string;
  apiVersion: string;
}

export interface SalesforceObject {
  Id: string;
  Name: string;
  CreatedDate: string;
  LastModifiedDate: string;
  [key: string]: any;
}

export interface LeadData extends SalesforceObject {
  Company: string;
  Title?: string;
  Email?: string;
  Phone?: string;
  Status: string;
  Rating?: string;
}

export interface OpportunityData extends SalesforceObject {
  AccountId: string;
  Amount: number;
  CloseDate: string;
  StageName: string;
  Probability: number;
  Type?: string;
}

export interface ContactData extends SalesforceObject {
  AccountId?: string;
  Email?: string;
  Phone?: string;
  Title?: string;
  Department?: string;
}

export class SalesforceConnector extends BaseConnector<SalesforceConfig> {
  protected readonly name = 'salesforce';
  private baseUrl: string = '';

  async connect(config: SalesforceConfig): Promise<void> {
    this.config = config;
    this.baseUrl = `${config.instanceUrl}/services/data/v${config.apiVersion}`;
    this.isConnected = true;
    
    console.log(`[Salesforce] Connected to ${config.instanceUrl}`);
  }

  async syncLeads(since?: Date): Promise<SyncResult<LeadData>> {
    if (!this.isConnected) {
      throw new Error('Salesforce connector not connected');
    }

    try {
      let query = 'SELECT Id, Name, Company, Title, Email, Phone, Status, Rating, CreatedDate, LastModifiedDate FROM Lead';
      
      if (since) {
        query += ` WHERE LastModifiedDate > ${since.toISOString()}`;
      }

      const response = await this.fetch(query);
      const records = response.records as LeadData[];

      return {
        success: true,
        data: records,
        count: records.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'Lead',
          queryExecuted: query,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        syncedAt: new Date(),
      };
    }
  }

  async syncOpportunities(since?: Date): Promise<SyncResult<OpportunityData>> {
    if (!this.isConnected) {
      throw new Error('Salesforce connector not connected');
    }

    try {
      let query = 'SELECT Id, Name, AccountId, Amount, CloseDate, StageName, Probability, Type, CreatedDate, LastModifiedDate FROM Opportunity';
      
      if (since) {
        query += ` WHERE LastModifiedDate > ${since.toISOString()}`;
      }

      const response = await this.fetch(query);
      const records = response.records as OpportunityData[];

      return {
        success: true,
        data: records,
        count: records.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'Opportunity',
          queryExecuted: query,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        syncedAt: new Date(),
      };
    }
  }

  async syncContacts(since?: Date): Promise<SyncResult<ContactData>> {
    if (!this.isConnected) {
      throw new Error('Salesforce connector not connected');
    }

    try {
      let query = 'SELECT Id, Name, AccountId, Email, Phone, Title, Department, CreatedDate, LastModifiedDate FROM Contact';
      
      if (since) {
        query += ` WHERE LastModifiedDate > ${since.toISOString()}`;
      }

      const response = await this.fetch(query);
      const records = response.records as ContactData[];

      return {
        success: true,
        data: records,
        count: records.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'Contact',
          queryExecuted: query,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        syncedAt: new Date(),
      };
    }
  }

  async getOpportunityStages(): Promise<string[]> {
    const describeResponse = await this.describe('Opportunity');
    const stageField = describeResponse.fields.find((f: any) => f.name === 'StageName');
    
    if (stageField && stageField.picklistValues) {
      return stageField.picklistValues.map((pv: any) => pv.value);
    }
    
    return [];
  }

  async createTask(
    subject: string,
    description: string,
    relatedToId?: string,
    dueDate?: Date,
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      const taskData: any = {
        Subject: subject,
        Description: description,
        Status: 'Not Started',
        Priority: 'Normal',
      };

      if (relatedToId) {
        taskData.WhatId = relatedToId;
      }

      if (dueDate) {
        taskData.ActivityDate = dueDate.toISOString().split('T')[0];
      }

      const response = await this.post('/sobjects/Task', taskData);
      
      return {
        success: true,
        taskId: response.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateRecord(
    objectType: string,
    recordId: string,
    fields: Record<string, any>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.patch(`/sobjects/${objectType}/${recordId}`, fields);
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async fetch(query: string): Promise<any> {
    const url = `${this.baseUrl}/query?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config!.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async post(path: string, data: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async patch(path: string, data: any): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.config!.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`);
    }
  }

  private async describe(objectType: string): Promise<any> {
    const url = `${this.baseUrl}/sobjects/${objectType}/describe`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config!.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`);
    }

    return response.json();
  }
}
