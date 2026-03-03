import { Module } from '@nestjs/common';
import { AppelOffresService } from './appel-offres.service';
import { AppelOffresController } from './appel-offres.controller';

@Module({
  controllers: [AppelOffresController],
  providers: [AppelOffresService],
})
export class AppelOffresModule {}
