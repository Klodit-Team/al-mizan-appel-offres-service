import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEvaluationController } from './criteres-evaluation.controller';
import { CriteresEvaluationService } from './criteres-evaluation.service';

describe('CriteresEvaluationController', () => {
  let controller: CriteresEvaluationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteresEvaluationController],
      providers: [CriteresEvaluationService],
    }).compile();

    controller = module.get<CriteresEvaluationController>(
      CriteresEvaluationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
