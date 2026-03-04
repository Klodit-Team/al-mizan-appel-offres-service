import { Module } from '@nestjs/common';
import { AppelOffresService } from './appel-offres.service';
import { AppelOffresController } from './appel-offres.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [AppelOffresController],
  providers: [AppelOffresService],
})
export class AppelOffresModule {}
