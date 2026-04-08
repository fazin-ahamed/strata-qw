import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PipelineModule } from './pipeline.module';

async function bootstrap() {
  const app = await NestFactory.create(PipelineModule);

  // Connect to Redis for message queues
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  });

  await app.startAllMicroservices();

  await app.listen(3006);
  console.log('Pipeline Service is running on port 3006');
}

bootstrap();
