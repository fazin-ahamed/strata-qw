import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DecisionService } from '@strata/decision-engine';
import { PredictionService } from '../prediction.service';

@Processor('intelligence')
export class IntelligenceWorker {
  private readonly logger = new Logger(IntelligenceWorker.name);

  constructor(
    private readonly decisionService: DecisionService,
    private readonly predictionService: PredictionService,
  ) {}

  @Process('generate-decisions')
  async handleDecisionGeneration(job: Job<any>) {
    const { entityId, entityType, context } = job.data;
    this.logger.log(`Generating decisions for ${entityType}:${entityId}`);
    
    try {
      const decisions = await this.decisionService.generateRecommendations({
        entityId,
        entityType,
        context,
      });
      
      // Store decisions in memory graph
      for (const decision of decisions) {
        await this.decisionService.storeDecision(decision);
      }
      
      // Trigger notification if high-priority decisions exist
      const highPriority = decisions.filter(d => d.priority === 'high');
      if (highPriority.length > 0) {
        await this.decisionService.triggerNotifications(highPriority);
      }
      
      return { status: 'success', decisionCount: decisions.length };
    } catch (error) {
      this.logger.error(`Decision generation failed: ${error.message}`);
      throw error;
    }
  }

  @Process('run-predictions')
  async handlePredictionRun(job: Job<any>) {
    const { entityType, filters } = job.data;
    this.logger.log(`Running predictions for ${entityType}`);
    
    try {
      // Commitment fulfillment probability
      if (entityType === 'commitment' || !entityType) {
        const commitmentPredictions = await this.predictionService.predictCommitmentFulfillment(filters);
        await this.predictionService.storePredictions(commitmentPredictions, 'commitment_fulfillment');
      }
      
      // Churn risk detection
      if (entityType === 'customer' || !entityType) {
        const churnPredictions = await this.predictionService.detectChurnRisk(filters);
        await this.predictionService.storePredictions(churnPredictions, 'churn_risk');
      }
      
      // Cash flow forecasting
      if (entityType === 'finance' || !entityType) {
        const cashFlowPredictions = await this.predictionService.forecastCashFlow(filters);
        await this.predictionService.storePredictions(cashFlowPredictions, 'cash_flow');
      }
      
      // Anomaly detection
      const anomalies = await this.predictionService.detectAnomalies(entityType, filters);
      if (anomalies.length > 0) {
        await this.predictionService.flagAnomalies(anomalies);
      }
      
      return { status: 'success', predictionTypes: ['commitment', 'churn', 'cashflow', 'anomaly'] };
    } catch (error) {
      this.logger.error(`Prediction run failed: ${error.message}`);
      throw error;
    }
  }

  @Process('update-memory-graph')
  async handleMemoryGraphUpdate(job: Job<any>) {
    const { event, entities, relationships } = job.data;
    this.logger.log(`Updating memory graph with event:${event.id}`);
    
    try {
      // Update entity embeddings
      for (const entity of entities) {
        await this.predictionService.updateEntityEmbedding(entity);
      }
      
      // Create/update relationships
      for (const relationship of relationships) {
        await this.predictionService.createRelationship(relationship);
      }
      
      // Learn temporal patterns
      await this.predictionService.learnTemporalPatterns(event);
      
      return { status: 'success', entitiesUpdated: entities.length };
    } catch (error) {
      this.logger.error(`Memory graph update failed: ${error.message}`);
      throw error;
    }
  }
}
