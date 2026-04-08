import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrchestratorModule } from './orchestrator.module';

async function bootstrap() {
  const app = await NestFactory.create(OrchestratorModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.enableCors();
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 4003;
  
  await app.listen(port);
  console.log(`Task Orchestrator service running on port ${port}`);
}

bootstrap();
