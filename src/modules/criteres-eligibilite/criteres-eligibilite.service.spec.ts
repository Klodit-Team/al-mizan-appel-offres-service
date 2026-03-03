import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';

describe('CriteresEligibiliteService', () => {
  let service: CriteresEligibiliteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CriteresEligibiliteService],
    }).compile();

    service = module.get<CriteresEligibiliteService>(CriteresEligibiliteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
