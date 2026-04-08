import { Injectable, Logger } from '@nestjs/common';

export interface NormalizedRecord {
  id: string;
  type: string;
  fields: Record<string, any>;
  standardFields: {
    title?: string;
    description?: string;
    date?: Date;
    participants?: string[];
    source?: string;
  };
}

@Injectable()
export class NormalizationProcessor {
  private readonly logger = new Logger(NormalizationProcessor.name);

  async normalize(data: any, type: string): Promise<NormalizedRecord> {
    this.logger.log(`Normalizing data of type ${type}`);

    const standardFields = this.extractStandardFields(data, type);

    return {
      id: data.id || `norm_${Date.now()}`,
      type,
      fields: data,
      standardFields,
    };
  }

  private extractStandardFields(data: any, type: string): NormalizedRecord['standardFields'] {
    const standard: NormalizedRecord['standardFields'] = {};

    // Extract title from various field names
    standard.title = 
      data.subject || 
      data.title || 
      data.name || 
      data.summary || 
      data.description?.substring(0, 100) ||
      '';

    // Extract description
    standard.description = 
      data.body || 
      data.content || 
      data.description || 
      data.snippet ||
      '';

    // Extract date
    const dateValue = 
      data.date || 
      data.created_at || 
      data.timestamp || 
      data.startTime || 
      data.start_time ||
      data.createdAt;
    
    if (dateValue) {
      standard.date = new Date(dateValue);
    }

    // Extract participants
    if (data.participants && Array.isArray(data.participants)) {
      standard.participants = data.participants.map((p: any) => 
        typeof p === 'string' ? p : p.email || p.id || p.name
      ).filter(Boolean);
    } else if (data.to && Array.isArray(data.to)) {
      standard.participants = data.to.map((t: any) => 
        typeof t === 'string' ? t : t.email || t.address
      );
    }

    // Extract source
    standard.source = data.source || data.connectorType || 'unknown';

    return standard;
  }

  async normalizeBatch(records: Array<{ data: any; type: string }>): Promise<NormalizedRecord[]> {
    this.logger.log(`Batch normalizing ${records.length} records`);
    
    return Promise.all(
      records.map(record => this.normalize(record.data, record.type))
    );
  }

  validateSchema(data: any, schema: Record<string, string>): boolean {
    for (const [field, expectedType] of Object.entries(schema)) {
      if (!(field in data)) {
        this.logger.warn(`Missing required field: ${field}`);
        return false;
      }

      const actualType = typeof data[field];
      if (actualType !== expectedType && actualType !== 'undefined') {
        this.logger.warn(`Field ${field} has wrong type: expected ${expectedType}, got ${actualType}`);
        return false;
      }
    }

    return true;
  }
}
