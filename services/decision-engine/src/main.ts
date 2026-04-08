import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DecisionEngineModule } from './decision-engine.module';

async function bootstrap() {
  const app = await NestFactory.create(DecisionEngineModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.enableCors();
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 4002;
  
  await app.listen(port);
  console.log(`Decision Engine service running on port ${port}`);
}

bootstrap();
