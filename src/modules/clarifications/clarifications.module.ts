import { Module } from '@nestjs/common';
import { ClarificationsService } from './clarifications.service';
import { ClarificationsController } from './clarifications.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagingModule } from '../../messaging/messaging.module';

@Module({
  imports: [PrismaModule, MessagingModule],
  controllers: [ClarificationsController],
  providers: [ClarificationsService],
  exports: [ClarificationsService],
})
export class ClarificationsModule {}
