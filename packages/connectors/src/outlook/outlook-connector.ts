import { Connector, SyncResult, Entity } from '@strata/shared';
import { Client, User as OutlookUser, Event as OutlookEvent, Message } from '@microsoft/microsoft-graph-types';

export interface OutlookConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  refreshToken?: string;
}

export class OutlookConnector implements Connector {
  private client: Client;
  private config: OutlookConfig;

  constructor(config: OutlookConfig) {
    this.config = config;
    this.client = this.initClient();
  }

  private initClient(): Client {
    // In production, implement proper OAuth2 token management
    return {
      api: (path: string) => ({
        get: async () => ({ data: {} }),
        post: async (data: any) => ({ data }),
      }),
    } as any;
  }

  async sync(): Promise<SyncResult> {
    const results = await Promise.all([
      this.syncEmails(),
      this.syncCalendar(),
      this.syncContacts(),
    ]);

    return {
      entities: results.flatMap(r => r.entities),
      events: results.flatMap(r => r.events),
      errors: results.flatMap(r => r.errors),
    };
  }

  private async syncEmails(): Promise<SyncResult> {
    try {
      const response = await this.client.api('/me/messages').get();
      const messages: Message[] = response.data.value || [];

      const entities: Entity[] = messages.map(msg => ({
        id: `outlook_email_${msg.id}`,
        type: 'email',
        source: 'outlook',
        data: {
          subject: msg.subject,
          from: msg.from?.emailAddress?.address,
          toRecipients: msg.toRecipients?.map(r => r.emailAddress?.address),
          receivedDateTime: msg.receivedDateTime,
          body: msg.body?.content,
          hasAttachments: msg.hasAttachments,
        },
        timestamp: msg.receivedDateTime ? new Date(msg.receivedDateTime).toISOString() : new Date().toISOString(),
      }));

      return { entities, events: [], errors: [] };
    } catch (error) {
      return {
        entities: [],
        events: [],
        errors: [{ source: 'outlook', message: 'Failed to sync emails', error: String(error) }],
      };
    }
  }

  private async syncCalendar(): Promise<SyncResult> {
    try {
      const response = await this.client.api('/me/events').get();
      const events: OutlookEvent[] = response.data.value || [];

      const entities: Entity[] = events.map(event => ({
        id: `outlook_event_${event.id}`,
        type: 'calendar_event',
        source: 'outlook',
        data: {
          subject: event.subject,
          start: event.start?.dateTime,
          end: event.end?.dateTime,
          location: event.location?.displayName,
          attendees: event.attendees?.map(a => a.emailAddress?.address),
          organizer: event.organizer?.emailAddress?.address,
          isOnlineMeeting: event.isOnlineMeeting,
        },
        timestamp: event.createdDateTime ? new Date(event.createdDateTime).toISOString() : new Date().toISOString(),
      }));

      return { entities, events: [], errors: [] };
    } catch (error) {
      return {
        entities: [],
        events: [],
        errors: [{ source: 'outlook', message: 'Failed to sync calendar', error: String(error) }],
      };
    }
  }

  private async syncContacts(): Promise<SyncResult> {
    try {
      const response = await this.client.api('/me/contacts').get();
      const contacts: OutlookUser[] = response.data.value || [];

      const entities: Entity[] = contacts.map(contact => ({
        id: `outlook_contact_${contact.id}`,
        type: 'contact',
        source: 'outlook',
        data: {
          displayName: contact.displayName,
          emailAddresses: contact.emailAddresses?.map(e => e.address),
          phoneNumbers: contact.businessPhones,
          company: contact.companyName,
          jobTitle: contact.jobTitle,
        },
        timestamp: new Date().toISOString(),
      }));

      return { entities, events: [], errors: [] };
    } catch (error) {
      return {
        entities: [],
        events: [],
        errors: [{ source: 'outlook', message: 'Failed to sync contacts', error: String(error) }],
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.api('/me').get();
      return true;
    } catch {
      return false;
    }
  }
}
