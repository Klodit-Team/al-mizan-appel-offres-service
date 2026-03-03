import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEligibiliteController } from './criteres-eligibilite.controller';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';

describe('CriteresEligibiliteController', () => {
  let controller: CriteresEligibiliteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteresEligibiliteController],
      providers: [CriteresEligibiliteService],
    }).compile();

    controller = module.get<CriteresEligibiliteController>(
      CriteresEligibiliteController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
