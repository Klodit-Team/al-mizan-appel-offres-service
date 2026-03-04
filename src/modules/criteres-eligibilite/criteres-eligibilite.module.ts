import { Module } from '@nestjs/common';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';
import { CriteresEligibiliteController } from './criteres-eligibilite.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CriteresEligibiliteController],
  providers: [CriteresEligibiliteService],
})
export class CriteresEligibiliteModule { }

