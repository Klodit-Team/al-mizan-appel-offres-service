import { Module } from '@nestjs/common';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';
import { CriteresEligibiliteController } from './criteres-eligibilite.controller';

@Module({
  controllers: [CriteresEligibiliteController],
  providers: [CriteresEligibiliteService],
})
export class CriteresEligibiliteModule {}
