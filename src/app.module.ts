import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { PrismaModule } from './prisma/prisma.module';
import { AppelOffresModule } from './modules/appel-offres/appel-offres.module';
import { LotsModule } from './modules/lots/lots.module';
import { CriteresEligibiliteModule } from './modules/criteres-eligibilite/criteres-eligibilite.module';
import { CriteresEvaluationModule } from './modules/criteres-evaluation/criteres-evaluation.module';
import { StorageModule } from './storage/storage.module';
import { MessagingModule } from './messaging/messaging.module';

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

    PrismaModule,

    // Modules métier
    AppelOffresModule,
    LotsModule,
    CriteresEligibiliteModule,
    CriteresEvaluationModule,
    StorageModule,

    // Messagerie RabbitMQ (Publisher + Consumer enregistrés dans AppelOffresModule)
    MessagingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
