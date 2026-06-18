import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GreAGreService } from './gre-a-gre.service';
import { GreAGreController } from './gre-a-gre.controller';
import { GreAGreConsumer } from '../../messaging/consumers/gre-a-gre.consumer';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
  imports: [HttpModule, MessagingModule],
  controllers: [GreAGreController, GreAGreConsumer],
  providers: [GreAGreService],
  exports: [GreAGreService],
})
export class GreAGreModule {}
