import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { VisualProcessorModule } from './visual-processor.controller';

async function bootstrap() {
  const app = await NestFactory.create(VisualProcessorModule);
  
  // Enable CORS for frontend apps
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });
  
  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  const port = process.env.PORT || 4006;
  await app.listen(port);
  
  console.log(`🎨 Visual Processor Service running on http://localhost:${port}`);
}

bootstrap();
