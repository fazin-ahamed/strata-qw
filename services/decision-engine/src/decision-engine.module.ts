import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DecisionEngineController } from './decision-engine.controller';
import { DecisionEngineService } from './decision-engine.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
  ],
  controllers: [DecisionEngineController],
  providers: [DecisionEngineService],
})
export class DecisionEngineModule {}
