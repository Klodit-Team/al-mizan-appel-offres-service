import { Test, TestingModule } from '@nestjs/testing';
import { AppelOffresController } from './appel-offres.controller';
import { AppelOffresService } from './appel-offres.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AppelOffresController', () => {
  let controller: AppelOffresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppelOffresController],
      providers: [
        AppelOffresService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AppelOffresController>(AppelOffresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
