import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AoEventsPublisher } from './publishers/ao-events.publisher';

/**
 * MessagingModule — Responsable de toute la couche RabbitMQ.
 *
 * Ce module est IMPORTÉ par AppelOffresModule pour fournir AoEventsPublisher.
 * Le consumer (RecoursConsumer) est enregistré dans AppelOffresModule pour éviter
 * une dépendance circulaire (consumer a besoin d'AppelOffresService).
 *
 * Architecture :
 *   AppelOffresModule  ──imports──▶  MessagingModule  ──exports──▶  AoEventsPublisher
 *   AppelOffresModule  ──controllers──▶  RecoursConsumer
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_EVENT_BUS',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>(
                'RABBITMQ_URL',
                'amqp://guest:guest@localhost:5673',
              ),
            ],
            queue: configService.get<string>('RABBITMQ_QUEUE_AO', 'ao.queue'),
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  providers: [AoEventsPublisher],
  exports: [AoEventsPublisher], // ← Exporté pour être injecté dans AppelOffresService
})
export class MessagingModule {}
