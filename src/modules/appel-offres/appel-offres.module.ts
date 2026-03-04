import { Module } from '@nestjs/common';
import { AppelOffresService } from './appel-offres.service';
import { AppelOffresController } from './appel-offres.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppelOffresController],
  providers: [AppelOffresService],
})
export class AppelOffresModule { }

