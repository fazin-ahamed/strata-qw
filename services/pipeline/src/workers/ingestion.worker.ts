import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PipelineService } from '../pipeline.service';

@Processor('data-ingestion')
export class IngestionWorker {
  private readonly logger = new Logger(IngestionWorker.name);

  constructor(private readonly pipelineService: PipelineService) {}

  @Process('ingest-email')
  async handleEmailIngestion(job: Job<any>) {
    const { connectorId, rawData, metadata } = job.data;
    this.logger.log(`Processing email ingestion from ${connectorId}`);
    
    try {
      const normalized = await this.pipelineService.normalize('email', rawData);
      const enriched = await this.pipelineService.enrich(normalized, metadata);
      await this.pipelineService.store(enriched, 'events');
      
      // Trigger downstream processors
      await this.pipelineService.triggerDownstream('email-processed', enriched);
      
      return { status: 'success', entityId: enriched.id };
    } catch (error) {
      this.logger.error(`Email ingestion failed: ${error.message}`);
      throw error;
    }
  }

  @Process('ingest-meeting')
  async handleMeetingIngestion(job: Job<any>) {
    const { connectorId, rawData, transcript, visualSnippets } = job.data;
    this.logger.log(`Processing meeting ingestion from ${connectorId}`);
    
    try {
      const normalized = await this.pipelineService.normalize('meeting', rawData);
      
      // Process transcript if available
      if (transcript) {
        const actions = await this.pipelineService.extractActionItems(transcript);
        const decisions = await this.pipelineService.extractDecisions(transcript);
        normalized.actionItems = actions;
        normalized.decisions = decisions;
      }
      
      // Process visual snippets
      if (visualSnippets && visualSnippets.length > 0) {
        normalized.visualContext = visualSnippets;
      }
      
      const enriched = await this.pipelineService.enrich(normalized, { source: 'meeting' });
      await this.pipelineService.store(enriched, 'events');
      
      // Update memory graph with participants and topics
      await this.pipelineService.updateMemoryGraph(enriched);
      
      return { status: 'success', entityId: enriched.id };
    } catch (error) {
      this.logger.error(`Meeting ingestion failed: ${error.message}`);
      throw error;
    }
  }

  @Process('ingest-crm-deal')
  async handleDealIngestion(job: Job<any>) {
    const { connectorId, rawData } = job.data;
    this.logger.log(`Processing CRM deal ingestion from ${connectorId}`);
    
    try {
      const normalized = await this.pipelineService.normalize('deal', rawData);
      const enriched = await this.pipelineService.enrich(normalized, { source: 'crm' });
      await this.pipelineService.store(enriched, 'entities');
      
      // Check for anomalies in deal progression
      await this.pipelineService.detectAnomalies(enriched);
      
      return { status: 'success', entityId: enriched.id };
    } catch (error) {
      this.logger.error(`Deal ingestion failed: ${error.message}`);
      throw error;
    }
  }
}
