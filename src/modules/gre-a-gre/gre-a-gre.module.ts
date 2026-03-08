import { Module } from '@nestjs/common';
import { GreAGreService } from './gre-a-gre.service';
import { GreAGreController } from './gre-a-gre.controller';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  controllers: [GreAGreController],
  providers: [GreAGreService],
})
export class GreAGreModule {}
