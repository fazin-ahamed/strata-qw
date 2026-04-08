import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { VisualProcessorModule } from './visual-processor.module';

async function bootstrap() {
  const app = await NestFactory.create(VisualProcessorModule);

  // Connect to Redis for message queues
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  });

  await app.startAllMicroservices();
  
  await app.listen(3005);
  console.log('Visual Processor Service is running on port 3005');
}

bootstrap();
