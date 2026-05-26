import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppelOffresService } from './appel-offres.service';
import { AppelOffresController } from './appel-offres.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AppelOffresScheduler } from './appel-offres.scheduler';

import { MessagingModule } from '../../messaging/messaging.module';
import { RecoursConsumer } from '../../messaging/consumers/recours.consumer';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    MessagingModule, // ← Fournit AoEventsPublisher à AppelOffresService et AppelOffresScheduler
  ],
  controllers: [
    AppelOffresController,
    RecoursConsumer, // ← Consumer RabbitMQ (besoin d'AppelOffresService, donc ici)
  ],
  providers: [
    AppelOffresService,
    AppelOffresScheduler, // ← Enregistrement du scheduler pour activation du Cron
  ],
  exports: [AppelOffresService], // ← Exporté si d'autres modules en ont besoin
})
export class AppelOffresModule {}
