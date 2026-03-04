import { Module } from '@nestjs/common';
import { AvisAoService } from './avis-ao.service';
import { AvisAoController } from './avis-ao.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AvisAoController],
  providers: [AvisAoService],
})
export class AvisAoModule {}
