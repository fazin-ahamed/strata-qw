import { Injectable } from '@nestjs/common';
import { EmailProvider } from './providers/email.provider';
import { PushProvider } from './providers/push.provider';
import { SmsProvider } from './providers/sms.provider';

export interface NotificationPayload {
  userId: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject?: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  metadata?: {
    category: 'decision' | 'alert' | 'reminder' | 'update' | 'meeting';
    entityId?: string;
    entityType?: string;
  };
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private emailProvider: EmailProvider,
    private pushProvider: PushProvider,
    private smsProvider: SmsProvider,
  ) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      let result: NotificationResult;

      switch (payload.type) {
        case 'email':
          result = await this.emailProvider.send({
            to: payload.userId, // Will be resolved to email in provider
            subject: payload.subject || 'Strata Notification',
            body: payload.body,
            data: payload.data,
            actionUrl: payload.actionUrl,
          });
          break;

        case 'push':
          result = await this.pushProvider.send({
            userId: payload.userId,
            title: payload.subject || 'Strata',
            body: payload.body,
            data: payload.data,
            actionUrl: payload.actionUrl,
            priority: payload.priority,
          });
          break;

        case 'sms':
          result = await this.smsProvider.send({
            userId: payload.userId,
            body: payload.body,
          });
          break;

        case 'in-app':
          // Store in database for in-app notification center
          result = await this.storeInAppNotification(payload);
          break;

        default:
          throw new Error(`Unsupported notification type: ${payload.type}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: payload.type,
      };
    }
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    const results = await Promise.all(
      payloads.map(payload => this.send(payload)),
    );
    return results;
  }

  async sendDecisionAlert(
    userId: string,
    decisionTitle: string,
    summary: string,
    actionRequired: boolean,
    actionUrl?: string,
  ): Promise<NotificationResult[]> {
    const payloads: NotificationPayload[] = [];

    // High priority in-app notification
    payloads.push({
      userId,
      type: 'in-app',
      priority: actionRequired ? 'high' : 'medium',
      subject: decisionTitle,
      body: summary,
      actionUrl,
      metadata: {
        category: 'decision',
        entityType: 'decision',
      },
    });

    // Email for important decisions
    if (actionRequired || decisionTitle.includes('Urgent')) {
      payloads.push({
        userId,
        type: 'email',
        priority: actionRequired ? 'high' : 'medium',
        subject: `Action Required: ${decisionTitle}`,
        body: `${summary}\n\nClick here to review: ${actionUrl || ''}`,
        actionUrl,
        metadata: {
          category: 'decision',
          entityType: 'decision',
        },
      });
    }

    return this.sendBatch(payloads);
  }

  async sendMeetingReminder(
    userId: string,
    meetingTitle: string,
    startTime: Date,
    meetingUrl?: string,
  ): Promise<NotificationResult> {
    const timeUntilMeeting = Math.round((startTime.getTime() - Date.now()) / 60000);
    
    return this.send({
      userId,
      type: 'push',
      priority: 'high',
      subject: 'Meeting Starting Soon',
      body: `${meetingTitle} starts in ${timeUntilMeeting} minutes`,
      data: {
        meetingTitle,
        startTime: startTime.toISOString(),
        meetingUrl,
      },
      actionUrl: meetingUrl,
      metadata: {
        category: 'meeting',
        entityType: 'meeting',
      },
    });
  }

  async sendAnomalyAlert(
    userId: string,
    anomalyType: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    entityId?: string,
  ): Promise<NotificationResult[]> {
    const priority = severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'medium';
    
    const payloads: NotificationPayload[] = [
      {
        userId,
        type: 'in-app',
        priority,
        subject: `Anomaly Detected: ${anomalyType}`,
        body: description,
        metadata: {
          category: 'alert',
          entityType: 'anomaly',
          entityId,
        },
      },
    ];

    // Send email for high/critical severity
    if (severity === 'high' || severity === 'critical') {
      payloads.push({
        userId,
        type: 'email',
        priority,
        subject: `[${severity.toUpperCase()}] Anomaly Alert: ${anomalyType}`,
        body: `${description}\n\nPlease review immediately in your Strata dashboard.`,
        metadata: {
          category: 'alert',
          entityType: 'anomaly',
          entityId,
        },
      });
    }

    // Send SMS for critical only
    if (severity === 'critical') {
      payloads.push({
        userId,
        type: 'sms',
        priority: 'urgent',
        body: `CRITICAL: ${anomalyType} - ${description.substring(0, 100)}`,
        metadata: {
          category: 'alert',
          entityType: 'anomaly',
          entityId,
        },
      });
    }

    return this.sendBatch(payloads);
  }

  private async storeInAppNotification(payload: NotificationPayload): Promise<NotificationResult> {
    // In production, this would store in PostgreSQL
    // For now, log and return success
    console.log(`[In-App Notification] User: ${payload.userId}, Type: ${payload.metadata?.category}, Priority: ${payload.priority}`);
    
    return {
      success: true,
      messageId: `inapp_${Date.now()}_${payload.userId}`,
      provider: 'in-app',
    };
  }
}
