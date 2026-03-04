import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import helmet from 'helmet';

async function bootstrap() {
  // ─── Mode Hybride : HTTP + Microservice RabbitMQ ──────────────────────────
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('AppelsOffres-Bootstrap');

  // Connecter le consumer RabbitMQ (écoute les événements entrants)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
      queue: process.env.RABBITMQ_QUEUE_AO ?? 'ao.queue',
      queueOptions: { durable: true },
      noAck: false, // Accusé de réception manuel pour garantir la livraison
    },
  });

  // Security: HTTP headers
  app.use(helmet());

  // Input validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle("Microservice Appels d'Offres")
    .setDescription(
      "Al-Mizan API pour la gestion du cycle de vie des appels d'offres",
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'session-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Démarrer le consumer RabbitMQ AVANT le serveur HTTP
  await app.startAllMicroservices();

  // Démarrer le serveur HTTP
  const port = process.env.PORT ?? 8003;
  await app.listen(port);

  logger.log(`🚀 HTTP Server: http://localhost:${port}/api`);
  logger.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🐇 RabbitMQ Consumer: écoute sur la queue "ao.queue"`);
}

bootstrap().catch((err) => {
  console.error('Erreur au démarrage du serveur', err);
  process.exit(1);
});
