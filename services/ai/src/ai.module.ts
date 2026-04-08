import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NarrativeModule } from './modules/narrative/narrative.module';
import { IntentModule } from './modules/intent/intent.module';
import { DecisionSupportModule } from './modules/decision-support/decision-support.module';
import { LLMProvider } from './providers/llm.provider';
import { VisionProvider } from './providers/vision.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NarrativeModule,
    IntentModule,
    DecisionSupportModule,
  ],
  providers: [LLMProvider, VisionProvider],
  exports: [LLMProvider, VisionProvider],
})
export class AIModule {}
