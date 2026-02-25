import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { ClientsModule, Transport } from '@nestjs/microservices';

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

        // Configuration MySQL (Transactionnelle) via TypeORM
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get<string>('DB_HOST', 'localhost'),
                port: configService.get<number>('DB_PORT', 3306),
                username: configService.get<string>('DB_USER', 'ao_user'),
                password: configService.get<string>('DB_PASSWORD', 'secret'),
                database: configService.get<string>('DB_NAME', 'ao_db'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: configService.get<string>('NODE_ENV') !== 'production', // AUTO-CREATION DES TABLES EN DEV UNIQUEMENT
                logging: configService.get<string>('NODE_ENV') === 'development',
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

        // Ajoutez ici les imports de vos modules métier (Ex: AppelOffresModule, LotsModule, ...)
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
