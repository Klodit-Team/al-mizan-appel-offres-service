import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { PrismaModule } from './prisma/prisma.module';
import { AppelOffresModule } from './modules/appel-offres/appel-offres.module';
import { LotsModule } from './modules/lots/lots.module';
import { CriteresEligibiliteModule } from './modules/criteres-eligibilite/criteres-eligibilite.module';
import { CriteresEvaluationModule } from './modules/criteres-evaluation/criteres-evaluation.module';
import { ScheduleModule } from '@nestjs/schedule';

import { MessagingModule } from './messaging/messaging.module';
import { AvisAoModule } from './modules/avis-ao/avis-ao.module';
import { AttributionModule } from './modules/attribution/attribution.module';
import { MarcheModule } from './modules/marche/marche.module';
import { GreAGreModule } from './modules/gre-a-gre/gre-a-gre.module';
import { ClarificationsModule } from './modules/clarifications/clarifications.module';

@Module({
  imports: [
    // Planificateur de tâches Cron
    ScheduleModule.forRoot(),

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
    GreAGreModule,
    AppelOffresModule,
    LotsModule,
    CriteresEligibiliteModule,
    CriteresEvaluationModule,

    // Messagerie RabbitMQ (Publisher + Consumer enregistrés dans AppelOffresModule)
    MessagingModule,

    AvisAoModule,

    AttributionModule,

    MarcheModule,
    ClarificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
