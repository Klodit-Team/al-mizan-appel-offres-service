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
  const rabbitUrl = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  const rabbitQueue = process.env.RABBITMQ_QUEUE_AO ?? 'ao.queue';

  // Connecter le consumer RabbitMQ (écoute les événements entrants)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: rabbitQueue,
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
  app.setGlobalPrefix('api/v1');

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
  SwaggerModule.setup('api/v1/docs', app, document);

  // Ne bloque pas le démarrage HTTP en dev si RabbitMQ est indisponible.
  app
    .startAllMicroservices()
    .then(() => {
      logger.log(`🐇 RabbitMQ Consumer actif sur la queue "${rabbitQueue}"`);
    })
    .catch((err) => {
      logger.warn(
        `RabbitMQ indisponible (${rabbitUrl}). Le service HTTP continue sans consumer.`,
      );
      logger.debug(String(err));
    });

  // Démarrer le serveur HTTP
  const port = process.env.PORT ?? 8003;
  await app.listen(port);

  logger.log(`🚀 HTTP Server: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger: http://localhost:${port}/api/v1/docs`);
}

bootstrap().catch((err) => {
  console.error('Erreur au démarrage du serveur', err);
  process.exit(1);
});
