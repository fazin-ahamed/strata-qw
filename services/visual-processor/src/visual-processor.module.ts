import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScreenshotProcessor } from './processors/screenshot.processor';
import { VisualRelevanceService } from './processors/visual-relevance.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [ScreenshotProcessor, VisualRelevanceService],
  exports: [ScreenshotProcessor, VisualRelevanceService],
})
export class VisualProcessorModule {}
