import { Module } from '@nestjs/common';
import { MarcheController } from './marche.controller';
import { MarcheService } from './marche.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarcheController],
  providers: [MarcheService],
})
export class MarcheModule {}
