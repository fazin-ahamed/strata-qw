import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { TranscriptionModule } from './transcription.module';

async function bootstrap() {
  const app = await NestFactory.create(TranscriptionModule);

  // Connect to Redis for message queues
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  });

  await app.startAllMicroservices();
  
  await app.listen(3004);
  console.log('Transcription Service is running on port 3004');
}

bootstrap();
