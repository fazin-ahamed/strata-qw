import { Worker, Job } from 'bullmq';
import { QueueName, EnrichedEntity } from '@strata/shared';
import { Pool } from 'pg';

export interface GraphBuilderJobData {
  entity: EnrichedEntity;
  source: string;
  connectorId: string;
}

export class GraphBuilderWorker {
  private worker: Worker;
  private dbPool: Pool;

  constructor(redisUrl: string, dbPool: Pool) {
    this.dbPool = dbPool;

    this.worker = new Worker(
      QueueName.GRAPH_BUILDER,
      async (job: Job<GraphBuilderJobData>) => this.process(job),
      {
        connection: { url: redisUrl },
        concurrency: 2,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`Graph builder job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Graph builder job ${job?.id} failed:`, err);
    });
  }

  private async process(job: Job<GraphBuilderJobData>): Promise<void> {
    const { entity, source, connectorId } = job.data;

    console.log(`Building graph for entity ${entity.id}`);

    // Insert or update entity in database
    await this.upsertEntity(entity);

    // Extract and create relationships
    await this.createRelationships(entity);

    // Update temporal patterns
    await this.updateTemporalPatterns(entity);

    console.log(`Graph update complete for ${entity.id}`);
  }

  private async upsertEntity(entity: EnrichedEntity): Promise<void> {
    const query = `
      INSERT INTO entities (id, type, source, data, enriched_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        enriched_data = EXCLUDED.enriched_data,
        updated_at = NOW()
    `;

    await this.dbPool.query(query, [
      entity.id,
      entity.type,
      entity.source,
      JSON.stringify(entity.data),
      JSON.stringify(entity.enriched),
    ]);
  }

  private async createRelationships(entity: EnrichedEntity): Promise<void> {
    const relationships = this.extractRelationships(entity);

    for (const rel of relationships) {
      const query = `
        INSERT INTO relationships (from_entity_id, to_entity_id, type, data, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (from_entity_id, to_entity_id, type) DO NOTHING
      `;

      await this.dbPool.query(query, [
        rel.from,
        rel.to,
        rel.type,
        JSON.stringify(rel.data),
      ]);
    }
  }

  private extractRelationships(entity: EnrichedEntity): Array<{
    from: string;
    to: string;
    type: string;
    data: any;
  }> {
    const relationships: any[] = [];

    // Extract person relationships from enriched entities
    if (entity.enriched?.entities) {
      for (const detectedEntity of entity.enriched.entities) {
        if (detectedEntity.type === 'person') {
          relationships.push({
            from: entity.id,
            to: `person:${detectedEntity.text}`,
            type: 'mentions',
            data: { confidence: detectedEntity.confidence },
          });
        } else if (detectedEntity.type === 'organization') {
          relationships.push({
            from: entity.id,
            to: `organization:${detectedEntity.text}`,
            type: 'references',
            data: { confidence: detectedEntity.confidence },
          });
        }
      }
    }

    // Extract relationships from entity data
    if (entity.data.from) {
      relationships.push({
        from: entity.id,
        to: `person:${entity.data.from}`,
        type: 'from',
        data: {},
      });
    }

    if (entity.data.toRecipients) {
      for (const recipient of entity.data.toRecipients) {
        relationships.push({
          from: entity.id,
          to: `person:${recipient}`,
          type: 'to',
          data: {},
        });
      }
    }

    if (entity.data.assignee) {
      relationships.push({
        from: entity.id,
        to: `person:${entity.data.assignee}`,
        type: 'assigned_to',
        data: {},
      });
    }

    return relationships;
  }

  private async updateTemporalPatterns(entity: EnrichedEntity): Promise<void> {
    const timestamp = entity.timestamp || new Date().toISOString();
    const date = new Date(timestamp);

    const query = `
      INSERT INTO temporal_patterns (entity_id, hour_of_day, day_of_week, month, year, pattern_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (entity_id, hour_of_day, day_of_week, month, year, pattern_type) DO NOTHING
    `;

    await this.dbPool.query(query, [
      entity.id,
      date.getHours(),
      date.getDay(),
      date.getMonth() + 1,
      date.getFullYear(),
      entity.type,
    ]);
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
