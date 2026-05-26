import { Test, TestingModule } from '@nestjs/testing';
import { ClarificationsController } from './clarifications.controller';
import { ClarificationsService } from './clarifications.service';
import { CreateDemandeClarificationDto } from './dto/create-demande-clarification.dto';
import { RepondreClarificationDto } from './dto/repondre-clarification.dto';

describe('ClarificationsController', () => {
  let controller: ClarificationsController;
  const mockClarification = {
    id: 'clarif-id',
    aoId: 'ao-id',
    operateurId: 'operateur-id',
    question: 'Est-il possible de prolonger le délai ?',
    reponse: null,
    reponduAt: null,
  };

  const mockClarificationsService = {
    create: jest.fn().mockResolvedValue(mockClarification),
    findAllByAo: jest.fn().mockResolvedValue([mockClarification]),
    repondre: jest.fn().mockResolvedValue({
      ...mockClarification,
      reponse: 'Réponse test',
      reponduAt: new Date(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClarificationsController],
      providers: [
        {
          provide: ClarificationsService,
          useValue: mockClarificationsService,
        },
      ],
    }).compile();

    controller = module.get<ClarificationsController>(ClarificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('devrait appeler service.create avec les bons arguments', async () => {
      const dto: CreateDemandeClarificationDto = {
        question: 'Est-il possible de prolonger le délai ?',
      };
      const req = { user: { sub: 'operateur-id' } } as any;

      const result = await controller.create('ao-id', '', req, dto);

      expect(mockClarificationsService.create).toHaveBeenCalledWith(
        'ao-id',
        'operateur-id',
        dto.question,
      );
      expect(result).toEqual(mockClarification);
    });

    it("devrait utiliser 'x-user-id' si fourni dans les en-têtes", async () => {
      const dto: CreateDemandeClarificationDto = {
        question: 'Est-il possible de prolonger le délai ?',
      };
      const req = {} as any;

      await controller.create('ao-id', 'hdr-user-id', req, dto);

      expect(mockClarificationsService.create).toHaveBeenCalledWith(
        'ao-id',
        'hdr-user-id',
        dto.question,
      );
    });
  });

  describe('findAll', () => {
    it('devrait retourner un tableau de clarifications', async () => {
      const result = await controller.findAll('ao-id');
      expect(mockClarificationsService.findAllByAo).toHaveBeenCalledWith(
        'ao-id',
      );
      expect(result).toEqual([mockClarification]);
    });
  });

  describe('repondre', () => {
    it('devrait appeler service.repondre avec la réponse', async () => {
      const dto: RepondreClarificationDto = {
        reponse: 'Réponse test',
      };
      const req = { user: { sub: 'contractant-id' } } as any;

      const result = await controller.repondre(
        'ao-id',
        'clarif-id',
        '',
        req,
        dto,
      );

      expect(mockClarificationsService.repondre).toHaveBeenCalledWith(
        'ao-id',
        'clarif-id',
        'contractant-id',
        dto.reponse,
      );
      expect(result.reponse).toEqual('Réponse test');
    });
  });
});
