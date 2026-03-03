import { Module } from '@nestjs/common';
import { CriteresEvaluationService } from './criteres-evaluation.service';
import { CriteresEvaluationController } from './criteres-evaluation.controller';

@Module({
  controllers: [CriteresEvaluationController],
  providers: [CriteresEvaluationService],
})
export class CriteresEvaluationModule {}
