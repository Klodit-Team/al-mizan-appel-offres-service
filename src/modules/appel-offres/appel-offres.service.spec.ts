import { Test, TestingModule } from '@nestjs/testing';
import { AppelOffresService } from './appel-offres.service';

describe('AppelOffresService', () => {
  let service: AppelOffresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppelOffresService],
    }).compile();

    service = module.get<AppelOffresService>(AppelOffresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
