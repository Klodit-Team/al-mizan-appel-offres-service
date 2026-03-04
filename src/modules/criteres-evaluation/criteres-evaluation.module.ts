import { Module } from '@nestjs/common';
import { CriteresEvaluationService } from './criteres-evaluation.service';
import { CriteresEvaluationController } from './criteres-evaluation.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CriteresEvaluationController],
  providers: [CriteresEvaluationService],
})
export class CriteresEvaluationModule {}
