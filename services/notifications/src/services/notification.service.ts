import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../providers/email.provider';
import { PushProvider } from '../providers/push.provider';
import { SMSProvider } from '../providers/sms.provider';

export interface NotificationRequest {
  userId: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject?: string;
  title?: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  scheduleAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: string[];
}

export interface UserPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  categories: {
    [category: string]: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private emailProvider: EmailProvider,
    private pushProvider: PushProvider,
    private smsProvider: SMSProvider,
  ) {}

  async send(request: NotificationRequest): Promise<boolean> {
    this.logger.log(`Sending ${request.type} notification to user ${request.userId}`);

    // Check user preferences
    const preferences = await this.getUserPreferences(request.userId);
    
    if (!this.shouldSend(request, preferences)) {
      this.logger.debug(`Notification suppressed based on user preferences`);
      return false;
    }

    // Check quiet hours
    if (this.isQuietHours(request.userId, preferences)) {
      this.logger.debug(`Quiet hours active, scheduling for later`);
      return this.scheduleNotification(request);
    }

    try {
      switch (request.type) {
        case 'email':
          return await this.sendEmail(request);
        case 'push':
          return await this.sendPush(request);
        case 'sms':
          return await this.sendSMS(request);
        case 'in_app':
          return await this.sendInApp(request);
        default:
          throw new Error(`Unknown notification type: ${request.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      throw error;
    }
  }

  private async sendEmail(request: NotificationRequest): Promise<boolean> {
    const user = await this.getUserEmail(request.userId);
    
    return this.emailProvider.send({
      to: user,
      subject: request.subject || 'Strata Notification',
      body: request.body,
      data: request.data,
    });
  }

  private async sendPush(request: NotificationRequest): Promise<boolean> {
    const deviceTokens = await this.getUserDeviceTokens(request.userId);
    
    return this.pushProvider.send({
      tokens: deviceTokens,
      title: request.title || 'Strata',
      body: request.body,
      data: request.data,
      actionUrl: request.actionUrl,
    });
  }

  private async sendSMS(request: NotificationRequest): Promise<boolean> {
    const phoneNumber = await this.getUserPhone(request.userId);
    
    return this.smsProvider.send({
      to: phoneNumber,
      body: request.body,
    });
  }

  private async sendInApp(request: NotificationRequest): Promise<boolean> {
    // Store in-app notification in database
    // Would be retrieved by frontend via WebSocket or polling
    this.logger.debug(`Storing in-app notification for user ${request.userId}`);
    return true;
  }

  private shouldSend(request: NotificationRequest, preferences: UserPreferences): boolean {
    switch (request.type) {
      case 'email':
        return preferences.emailEnabled;
      case 'push':
        return preferences.pushEnabled;
      case 'sms':
        return preferences.smsEnabled && request.priority === 'urgent';
      default:
        return true;
    }
  }

  private isQuietHours(userId: string, preferences: UserPreferences): boolean {
    if (!preferences.quietHours) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private async scheduleNotification(request: NotificationRequest): Promise<boolean> {
    // Add to queue for later delivery
    // Would use BullMQ job scheduling
    this.logger.debug(`Scheduling notification for ${request.scheduleAt || 'after quiet hours'}`);
    return true;
  }

  // Placeholder methods - would integrate with user service/database
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    return {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      categories: {},
    };
  }

  private async getUserEmail(userId: string): Promise<string> {
    return `user${userId}@example.com`;
  }

  private async getUserDeviceTokens(userId: string): Promise<string[]> {
    return ['device-token-1'];
  }

  private async getUserPhone(userId: string): Promise<string> {
    return '+1234567890';
  }

  async sendBatch(requests: NotificationRequest[]): Promise<number> {
    const results = await Promise.allSettled(
      requests.map(req => this.send(req))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    this.logger.log(`Batch notification: ${successCount}/${requests.length} sent successfully`);
    
    return successCount;
  }

  async unsubscribe(userId: string, type: 'email' | 'push' | 'sms'): Promise<void> {
    this.logger.log(`User ${userId} unsubscribed from ${type} notifications`);
    // Update user preferences in database
  }

  async testNotification(userId: string): Promise<void> {
    await this.send({
      userId,
      type: 'in_app',
      priority: 'low',
      body: 'This is a test notification from Strata.',
    });
  }
}
