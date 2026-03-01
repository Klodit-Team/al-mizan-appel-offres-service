import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [
        // Configuration globale des variables d'environnement
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Configuration Redis (Cache & Rate Limiting distribué)
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                store: await redisStore({
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                    ttl: 300 * 1000, // Durée de vie par défaut: 5 minutes (en ms)
                }),
            }),
        }),



        // Configuration Message Broker (RabbitMQ)
        ClientsModule.registerAsync([
            {
                name: 'RABBITMQ_EVENT_BUS',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')],
                        queue: configService.get<string>('RABBITMQ_QUEUE_AO', 'ao.queue'),
                        queueOptions: {
                            durable: true,
                        },
                    },
                }),
            },
        ]),



        PrismaModule,

        // Ajoutez ici les imports de vos modules métier (Ex: AppelOffresModule, LotsModule, ...)
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
