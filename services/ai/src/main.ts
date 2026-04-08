import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AIModule } from './ai.module';

async function bootstrap() {
  const app = await NestFactory.create(AIModule);

  // Connect to Redis for message queues
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  });

  await app.startAllMicroservices();
  
  await app.listen(3003);
  console.log('AI Service is running on port 3003');
}

bootstrap();
