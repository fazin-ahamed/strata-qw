import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ContextEngineModule } from './context-engine.module';

async function bootstrap() {
  const app = await NestFactory.create(ContextEngineModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.enableCors();
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 4004;
  
  await app.listen(port);
  console.log(`Context Engine service running on port ${port}`);
}

bootstrap();
