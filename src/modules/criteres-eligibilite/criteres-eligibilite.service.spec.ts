import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';

import { PrismaService } from '../../prisma/prisma.service';

describe('CriteresEligibiliteService', () => {
  let service: CriteresEligibiliteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CriteresEligibiliteService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<CriteresEligibiliteService>(
      CriteresEligibiliteService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
