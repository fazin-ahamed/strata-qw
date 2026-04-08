import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataIngestionProcessor } from './processors/data-ingestion.processor';
import { NormalizationProcessor } from './processors/normalization.processor';
import { EnrichmentProcessor } from './processors/enrichment.processor';
import { DetectionWorker } from './workers/detection.worker';
import { PredictionWorker } from './workers/prediction.worker';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    DataIngestionProcessor,
    NormalizationProcessor,
    EnrichmentProcessor,
    DetectionWorker,
    PredictionWorker,
  ],
  exports: [
    DataIngestionProcessor,
    NormalizationProcessor,
    EnrichmentProcessor,
  ],
})
export class PipelineModule {}
