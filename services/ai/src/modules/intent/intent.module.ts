import { Module } from '@nestjs/common';
import { IntentService } from './intent.service';
import { LLMProvider } from '../../providers/llm.provider';

@Module({
  providers: [IntentService, LLMProvider],
  exports: [IntentService],
})
export class IntentModule {}
