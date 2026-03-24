import { Module } from '@nestjs/common';
import { GreAGreService } from './gre-a-gre.service';
import { GreAGreController } from './gre-a-gre.controller';
import { GreAGreConsumer } from '../../messaging/consumers/gre-a-gre.consumer';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  controllers: [GreAGreController, GreAGreConsumer],
  providers: [GreAGreService],
  exports: [GreAGreService],
})
export class GreAGreModule {}
