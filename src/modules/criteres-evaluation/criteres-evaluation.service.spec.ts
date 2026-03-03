import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEvaluationService } from './criteres-evaluation.service';

describe('CriteresEvaluationService', () => {
  let service: CriteresEvaluationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CriteresEvaluationService],
    }).compile();

    service = module.get<CriteresEvaluationService>(CriteresEvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
