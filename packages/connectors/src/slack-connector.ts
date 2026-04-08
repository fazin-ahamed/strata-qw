import { BaseConnector, ConnectorConfig, SyncResult } from './base-connector';

export interface SlackConfig extends ConnectorConfig {
  botToken: string;
  appToken?: string; // For Socket Mode
  signingSecret?: string;
}

export interface SlackMessage {
  ts: string;
  channel: string;
  user?: string;
  text: string;
  type: 'message' | 'reaction_added' | 'reaction_removed' | 'file_shared';
  thread_ts?: string;
  reactions?: Array<{ name: string; count: number; users: string[] }>;
  files?: SlackFile[];
  blocks?: any[];
}

export interface SlackFile {
  id: string;
  name: string;
  title?: string;
  mimetype: string;
  url_private?: string;
  size: number;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  created: number;
  creator: string;
  is_archived: boolean;
  is_general: boolean;
  members?: string[];
  topic?: { value: string; creator: string; last_set: number };
  purpose?: { value: string; creator: string; last_set: number };
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email?: string;
    title?: string;
    department?: string;
    phone?: string;
    image_72?: string;
  };
  is_admin?: boolean;
  is_owner?: boolean;
  is_bot?: boolean;
}

export class SlackConnector extends BaseConnector<SlackConfig> {
  protected readonly name = 'slack';
  private apiUrl = 'https://slack.com/api';

  async connect(config: SlackConfig): Promise<void> {
    this.config = config;
    this.isConnected = true;
    
    // Test connection by calling auth.test
    const testResult = await this.authTest();
    console.log(`[Slack] Connected as ${testResult.user}`);
  }

  async syncMessages(
    channelId: string,
    oldest?: Date,
    latest?: Date,
  ): Promise<SyncResult<SlackMessage>> {
    if (!this.isConnected) {
      throw new Error('Slack connector not connected');
    }

    try {
      const oldestTs = oldest ? Math.floor(oldest.getTime() / 1000).toString() : '0';
      const latestTs = latest ? Math.floor(latest.getTime() / 1000).toString() : String(Date.now() / 1000);

      const response = await this.callApi('conversations.history', {
        channel: channelId,
        oldest: oldestTs,
        latest: latestTs,
        limit: 100,
        include_all_metadata: true,
      });

      const messages = response.messages as SlackMessage[];

      return {
        success: true,
        data: messages,
        count: messages.length,
        syncedAt: new Date(),
        metadata: {
          channelId,
          objectType: 'Message',
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

  async syncChannels(): Promise<SyncResult<SlackChannel>> {
    if (!this.isConnected) {
      throw new Error('Slack connector not connected');
    }

    try {
      const response = await this.callApi('conversations.list', {
        types: 'public_channel,private_channel',
        limit: 200,
      });

      const channels = response.channels as SlackChannel[];

      return {
        success: true,
        data: channels,
        count: channels.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'Channel',
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

  async syncUsers(): Promise<SyncResult<SlackUser>> {
    if (!this.isConnected) {
      throw new Error('Slack connector not connected');
    }

    try {
      const response = await this.callApi('users.list', {
        limit: 1000,
      });

      const users = response.members as SlackUser[];

      return {
        success: true,
        data: users,
        count: users.length,
        syncedAt: new Date(),
        metadata: {
          objectType: 'User',
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

  async sendMessage(
    channelId: string,
    text: string,
    threadTs?: string,
    blocks?: any[],
  ): Promise<{ success: boolean; ts?: string; error?: string }> {
    try {
      const response = await this.callApi('chat.postMessage', {
        channel: channelId,
        text,
        thread_ts: threadTs,
        blocks,
      });

      return {
        success: true,
        ts: response.ts,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async addReaction(
    channelId: string,
    timestamp: string,
    reactionName: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.callApi('reactions.add', {
        channel: channelId,
        timestamp,
        name: reactionName,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getChannelMembers(channelId: string): Promise<string[]> {
    const response = await this.callApi('conversations.members', {
      channel: channelId,
      limit: 1000,
    });

    return response.members || [];
  }

  async getUserPresence(userId: string): Promise<'active' | 'away'> {
    const response = await this.callApi('users.getPresence', {
      user: userId,
    });

    return response.presence as 'active' | 'away';
  }

  private async authTest(): Promise<any> {
    return this.callApi('auth.test', {});
  }

  private async callApi(method: string, params: Record<string, any>): Promise<any> {
    const url = `${this.apiUrl}/${method}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }
}
