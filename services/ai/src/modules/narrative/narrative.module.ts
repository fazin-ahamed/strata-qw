import { Module } from '@nestjs/common';
import { NarrativeService } from './narrative.service';
import { LLMProvider } from '../../providers/llm.provider';

@Module({
  providers: [NarrativeService, LLMProvider],
  exports: [NarrativeService],
})
export class NarrativeModule {}
