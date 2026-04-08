import { BaseConnector, ConnectorConfig, SyncResult } from './base-connector';

export class ZoomConnector extends BaseConnector {
  private accessToken: string | null = null;

  constructor(config: ConnectorConfig) {
    super(config);
  }

  async authenticate(): Promise<boolean> {
    const { clientId, clientSecret, accountId } = this.config.credentials;
    
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Zoom authentication failed:', error);
      return false;
    }
  }

  async sync(): Promise<SyncResult> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const entitiesCreated = 0;
    const eventsCreated = 0;
    const errors: string[] = [];

    // Fetch recent meetings
    const meetings = await this.fetchRecentMeetings();
    
    for (const meeting of meetings) {
      try {
        await this.processMeeting(meeting);
      } catch (err) {
        errors.push(`Failed to process meeting ${meeting.id}: ${err}`);
      }
    }

    const result: SyncResult = {
      connectorId: this.config.id,
      entitiesCreated,
      eventsCreated,
      errors,
      lastSyncedAt: new Date(),
    };

    await this.logSync(result);
    return result;
  }

  private async fetchRecentMeetings(): Promise<any[]> {
    const now = new Date();
    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    const response = await fetch(
      `https://api.zoom.us/v2/users/me/meetings?type=past&page_size=30`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );
    const data = await response.json();
    return data.meetings || [];
  }

  private async processMeeting(meeting: any): Promise<void> {
    // Extract meeting details: participants, duration, topic, start/end time
    // Create event in Entity Memory Graph
    // Link participants as entities
    // Store meeting metadata for transcription correlation
    
    const meetingDetails = await this.fetchMeetingDetails(meeting.uuid);
    console.log('Processing meeting:', meetingDetails.topic);
    
    // Push to pipeline for transcription and analysis
    await this.pushToPipeline(meetingDetails);
  }

  private async fetchMeetingDetails(uuid: string): Promise<any> {
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${uuid}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );
    return await response.json();
  }

  private async pushToPipeline(meeting: any): Promise<void> {
    // Send meeting metadata to pipeline service for processing
    // This triggers transcription job if recording is available
    console.log('Pushing meeting to pipeline:', meeting.uuid);
  }
}
