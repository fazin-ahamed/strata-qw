import { Module } from '@nestjs/common';
import { DecisionSupportService } from './decision-support.service';
import { LLMProvider } from '../../providers/llm.provider';

@Module({
  providers: [DecisionSupportService, LLMProvider],
  exports: [DecisionSupportService],
})
export class DecisionSupportModule {}
