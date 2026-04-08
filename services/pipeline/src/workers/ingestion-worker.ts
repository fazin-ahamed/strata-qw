import { Worker, Job } from 'bullmq';
import { QueueName } from '@strata/shared';

export interface IngestionJobData {
  connectorId: string;
  sourceType: string;
  config: any;
}

export class IngestionWorker {
  private worker: Worker;

  constructor(redisUrl: string) {
    this.worker = new Worker(
      QueueName.INGESTION,
      async (job: Job<IngestionJobData>) => this.process(job),
      {
        connection: { url: redisUrl },
        concurrency: 5,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`Ingestion job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Ingestion job ${job?.id} failed:`, err);
    });
  }

  private async process(job: Job<IngestionJobData>): Promise<void> {
    const { connectorId, sourceType, config } = job.data;

    console.log(`Starting ingestion for ${sourceType} (${connectorId})`);

    // Import connector dynamically
    const connector = await this.loadConnector(sourceType, config);

    // Sync data from source
    const result = await connector.sync();

    // Push raw data to next queue
    for (const entity of result.entities) {
      await this.queue.enqueue(QueueName.ENRICHMENT, {
        entity,
        source: sourceType,
        connectorId,
      });
    }

    // Log errors
    for (const error of result.errors) {
      console.error(`Sync error from ${error.source}:`, error.message);
    }

    console.log(`Ingestion complete: ${result.entities.length} entities synced`);
  }

  private async loadConnector(sourceType: string, config: any) {
    switch (sourceType) {
      case 'gmail':
        const { GmailConnector } = await import('@strata/connectors');
        return new GmailConnector(config);
      case 'outlook':
        const { OutlookConnector } = await import('@strata/connectors');
        return new OutlookConnector(config);
      case 'zoom':
        const { ZoomConnector } = await import('@strata/connectors');
        return new ZoomConnector(config);
      case 'salesforce':
        const { SalesforceConnector } = await import('@strata/connectors');
        return new SalesforceConnector(config);
      case 'hubspot':
        const { HubSpotConnector } = await import('@strata/connectors');
        return new HubSpotConnector(config);
      case 'slack':
        const { SlackConnector } = await import('@strata/connectors');
        return new SlackConnector(config);
      case 'jira':
        const { JiraConnector } = await import('@strata/connectors');
        return new JiraConnector(config);
      case 'stripe':
        const { StripeConnector } = await import('@strata/connectors');
        return new StripeConnector(config);
      default:
        throw new Error(`Unknown connector type: ${sourceType}`);
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
