import { Injectable, Logger } from '@nestjs/common';

export interface IngestionJob {
  id: string;
  source: string;
  connectorType: 'gmail' | 'zoom' | 'salesforce' | 'slack' | 'stripe' | 'custom';
  rawData: any;
  metadata: {
    receivedAt: Date;
    sourceId: string;
    entityType?: 'email' | 'meeting' | 'contact' | 'transaction' | 'message';
  };
}

export interface IngestedData {
  id: string;
  jobId: string;
  normalizedType: string;
  data: Record<string, any>;
  relationships?: Array<{
    type: string;
    targetId: string;
    properties?: Record<string, any>;
  }>;
  metadata: {
    ingestedAt: Date;
    source: string;
    confidence: number;
  };
}

@Injectable()
export class DataIngestionProcessor {
  private readonly logger = new Logger(DataIngestionProcessor.name);

  async ingest(job: IngestionJob): Promise<IngestedData> {
    this.logger.log(`Processing ingestion job ${job.id} from ${job.source}`);

    try {
      // Validate raw data
      this.validateRawData(job);

      // Transform based on connector type
      const normalizedData = await this.transformByConnector(job);

      // Extract relationships
      const relationships = this.extractRelationships(job, normalizedData);

      return {
        id: `ing_${Date.now()}_${job.id}`,
        jobId: job.id,
        normalizedType: this.getNormalizedType(job.connectorType),
        data: normalizedData,
        relationships,
        metadata: {
          ingestedAt: new Date(),
          source: job.source,
          confidence: 0.95,
        },
      };
    } catch (error) {
      this.logger.error(`Ingestion failed for job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  private validateRawData(job: IngestionJob): void {
    if (!job.rawData) {
      throw new Error('Raw data is required');
    }
  }

  private async transformByConnector(job: IngestionJob): Promise<Record<string, any>> {
    switch (job.connectorType) {
      case 'gmail':
        return this.transformEmail(job.rawData);
      case 'zoom':
        return this.transformMeeting(job.rawData);
      case 'salesforce':
        return this.transformCRM(job.rawData);
      case 'slack':
        return this.transformMessage(job.rawData);
      case 'stripe':
        return this.transformTransaction(job.rawData);
      default:
        return job.rawData;
    }
  }

  private transformEmail(raw: any): Record<string, any> {
    return {
      subject: raw.subject || '',
      body: raw.body || raw.snippet || '',
      from: raw.from?.email || raw.from || '',
      to: raw.to?.map((r: any) => r.email) || raw.to || [],
      cc: raw.cc?.map((r: any) => r.email) || [],
      date: raw.date || raw.internalDate,
      threadId: raw.threadId,
      messageId: raw.id || raw.messageId,
      hasAttachments: raw.attachments?.length > 0,
      labels: raw.labels || [],
    };
  }

  private transformMeeting(raw: any): Record<string, any> {
    return {
      title: raw.topic || raw.subject || '',
      startTime: raw.start_time || raw.startTime,
      endTime: raw.end_time || raw.endTime,
      duration: raw.duration,
      participants: raw.participants || [],
      host: raw.host?.email || raw.host || '',
      recordingUrl: raw.recording_url || raw.recordingUrl,
      transcriptAvailable: !!raw.transcript,
      meetingType: raw.type || 'scheduled',
    };
  }

  private transformCRM(raw: any): Record<string, any> {
    return {
      recordType: raw.type || 'contact',
      externalId: raw.id,
      name: raw.name || `${raw.first_name} ${raw.last_name}`.trim(),
      email: raw.email,
      phone: raw.phone,
      company: raw.company || raw.account?.name,
      stage: raw.stage || raw.status,
      value: raw.amount || raw.value,
      closeDate: raw.close_date,
      ownerId: raw.owner_id,
    };
  }

  private transformMessage(raw: any): Record<string, any> {
    return {
      channelId: raw.channel?.id || raw.channel,
      userId: raw.user?.id || raw.user,
      text: raw.text || raw.content,
      timestamp: raw.ts || raw.timestamp || raw.created_at,
      threadTs: raw.thread_ts,
      attachments: raw.files || raw.attachments || [],
      reactions: raw.reactions || [],
    };
  }

  private transformTransaction(raw: any): Record<string, any> {
    return {
      amount: raw.amount / 100, // Convert from cents
      currency: raw.currency,
      description: raw.description || raw.statement_descriptor,
      status: raw.status,
      customerId: raw.customer,
      paymentMethod: raw.payment_method_type,
      date: raw.created ? new Date(raw.created * 1000) : raw.date,
      metadata: raw.metadata || {},
    };
  }

  private extractRelationships(job: IngestionJob, data: Record<string, any>): any[] {
    const relationships: any[] = [];

    // Extract common relationship patterns
    if (data.from) {
      relationships.push({
        type: 'from_sender',
        targetId: `entity_${data.from}`,
        properties: { direction: 'incoming' },
      });
    }

    if (data.to && Array.isArray(data.to)) {
      data.to.forEach((recipient: string) => {
        relationships.push({
          type: 'to_recipient',
          targetId: `entity_${recipient}`,
          properties: { direction: 'outgoing' },
        });
      });
    }

    if (data.participants && Array.isArray(data.participants)) {
      data.participants.forEach((participant: any) => {
        const participantId = typeof participant === 'string' ? participant : participant.email || participant.id;
        relationships.push({
          type: 'participant',
          targetId: `entity_${participantId}`,
        });
      });
    }

    return relationships;
  }

  private getNormalizedType(connectorType: string): string {
    const mapping: Record<string, string> = {
      gmail: 'communication',
      zoom: 'event',
      salesforce: 'crm_record',
      slack: 'communication',
      stripe: 'transaction',
    };
    return mapping[connectorType] || 'generic';
  }

  async batchIngest(jobs: IngestionJob[]): Promise<IngestedData[]> {
    this.logger.log(`Batch processing ${jobs.length} ingestion jobs`);
    
    const results = await Promise.allSettled(
      jobs.map(job => this.ingest(job))
    );

    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<IngestedData>).value);

    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (failed > 0) {
      this.logger.warn(`Batch ingestion: ${successful.length} succeeded, ${failed} failed`);
    }

    return successful;
  }
}
