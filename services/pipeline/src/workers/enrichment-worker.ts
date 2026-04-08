import { Worker, Job } from 'bullmq';
import { QueueName, Entity } from '@strata/shared';

export interface EnrichmentJobData {
  entity: Entity;
  source: string;
  connectorId: string;
}

export interface EnrichedEntity extends Entity {
  enriched: {
    sentiment?: {
      score: number;
      label: 'positive' | 'neutral' | 'negative';
    };
    entities?: Array<{
      text: string;
      type: 'person' | 'organization' | 'location' | 'date' | 'money';
      confidence: number;
    }>;
    intent?: {
      type: string;
      confidence: number;
    };
    priority?: number;
  };
}

export class EnrichmentWorker {
  private worker: Worker;
  private aiServiceUrl: string;

  constructor(redisUrl: string, aiServiceUrl: string) {
    this.aiServiceUrl = aiServiceUrl;
    
    this.worker = new Worker(
      QueueName.ENRICHMENT,
      async (job: Job<EnrichmentJobData>) => this.process(job),
      {
        connection: { url: redisUrl },
        concurrency: 3,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`Enrichment job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Enrichment job ${job?.id} failed:`, err);
    });
  }

  private async process(job: Job<EnrichmentJobData>): Promise<void> {
    const { entity, source, connectorId } = job.data;

    console.log(`Enriching entity ${entity.id} from ${source}`);

    // Extract text content for analysis
    const textContent = this.extractTextContent(entity);

    // Call AI service for enrichment
    const enrichment = await this.callAiService(textContent, entity.type);

    // Create enriched entity
    const enrichedEntity: EnrichedEntity = {
      ...entity,
      enriched: {
        sentiment: enrichment.sentiment,
        entities: enrichment.entities,
        intent: enrichment.intent,
        priority: this.calculatePriority(entity, enrichment),
      },
    };

    // Push to graph builder queue
    await this.queue.enqueue(QueueName.GRAPH_BUILDER, {
      entity: enrichedEntity,
      source,
      connectorId,
    });
  }

  private extractTextContent(entity: Entity): string {
    const parts: string[] = [];
    
    if (entity.data.subject) parts.push(entity.data.subject);
    if (entity.data.body) parts.push(entity.data.body);
    if (entity.data.description) parts.push(entity.data.description);
    if (entity.data.summary) parts.push(entity.data.summary);
    if (entity.data.content) parts.push(entity.data.content);

    return parts.join('\n');
  }

  private async callAiService(text: string, entityType: string) {
    try {
      const response = await fetch(`${this.aiServiceUrl}/api/v1/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          entityType,
          tasks: ['sentiment', 'entities', 'intent'],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI enrichment failed:', error);
      // Return default values on failure
      return {
        sentiment: { score: 0, label: 'neutral' as const },
        entities: [],
        intent: null,
      };
    }
  }

  private calculatePriority(entity: Entity, enrichment: any): number {
    let priority = 50; // Default priority

    // Adjust based on sentiment
    if (enrichment.sentiment?.label === 'negative') {
      priority += 20;
    }

    // Adjust based on entity type
    if (entity.type === 'email' || entity.type === 'task') {
      priority += 10;
    }

    // Adjust based on detected intent
    if (enrichment.intent?.type === 'urgent' || enrichment.intent?.type === 'deadline') {
      priority += 25;
    }

    return Math.min(priority, 100);
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
