import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEvaluationController } from './criteres-evaluation.controller';
import { CriteresEvaluationService } from './criteres-evaluation.service';

import { PrismaService } from '../../prisma/prisma.service';

describe('CriteresEvaluationController', () => {
  let controller: CriteresEvaluationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteresEvaluationController],
      providers: [
        CriteresEvaluationService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<CriteresEvaluationController>(
      CriteresEvaluationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
