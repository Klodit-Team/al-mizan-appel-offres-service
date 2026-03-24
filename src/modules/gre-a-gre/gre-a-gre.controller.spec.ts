import { Test, TestingModule } from '@nestjs/testing';
import { GreAGreController } from './gre-a-gre.controller';
import { GreAGreService } from './gre-a-gre.service';
import { SubmitGreAGreDto } from './dto/submit-gre-a-gre.dto';
import { ValidateGreAGreDto } from './dto/validate-gre-a-gre.dto';
import {
  DecisionControleurGreAGre,
  TypeJustificationGreAGre,
} from '@prisma/client';
import { Request } from 'express';

const MOCK_CONTROLEUR_ID = 'controleur-jwt-sub-uuid';
const MOCK_AO_ID = '00000000-0000-0000-0000-000000000001';
const MOCK_DEMANDE_ID = '00000000-0000-0000-0000-000000000002';

// Simule un objet Request Express avec un user JWT décodé
const mockReq = {
  user: { sub: MOCK_CONTROLEUR_ID },
} as Request & { user: { sub: string } };

describe('GreAGreController', () => {
  let controller: GreAGreController;
  let service: jest.Mocked<GreAGreService>;

  const mockGreAGreService = {
    submit: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GreAGreController],
      providers: [
        {
          provide: GreAGreService,
          useValue: mockGreAGreService,
        },
      ],
    }).compile();

    controller = module.get<GreAGreController>(GreAGreController);
    service = module.get(GreAGreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── submit() ───────────────────────────────────────────────────────────────
  describe('submit()', () => {
    const submitDto: SubmitGreAGreDto = {
      justifications: [
        {
          type_justification: TypeJustificationGreAGre.ECONOMIQUE,
          description: 'Test de raison économique',
          documentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
      ],
    };

    it("devrait appeler service.submit avec l'aoId et le DTO", async () => {
      const result = { id: 'gag-123', statut: 'SOUMISE', aoId: MOCK_AO_ID };
      mockGreAGreService.submit.mockResolvedValue(result);

      const response = await controller.submit(MOCK_AO_ID, submitDto);

      expect(service.submit).toHaveBeenCalledWith(MOCK_AO_ID, submitDto);
      expect(response).toEqual(result);
    });

    it('devrait propager les exceptions levées par le service', async () => {
      mockGreAGreService.submit.mockRejectedValue(new Error('AO non trouvé'));
      await expect(controller.submit(MOCK_AO_ID, submitDto)).rejects.toThrow(
        'AO non trouvé',
      );
    });
  });

  // ─── validate() ─────────────────────────────────────────────────────────────
  describe('validate()', () => {
    const validateDto: ValidateGreAGreDto = {
      decision: DecisionControleurGreAGre.ACCEPTER,
      motif: 'Justifié et conforme à la réglementation.',
    };

    it('devrait appeler service.validate avec demandeId, DTO et controleurId extrait du JWT', async () => {
      const result = { updatedDemande: { statut: 'ACCEPTEE' } };
      mockGreAGreService.validate.mockResolvedValue(result);

      const response = await controller.validate(
        MOCK_DEMANDE_ID,
        validateDto,
        mockReq,
      );

      expect(service.validate).toHaveBeenCalledWith(
        MOCK_DEMANDE_ID,
        validateDto,
        MOCK_CONTROLEUR_ID,
      );
      expect(response).toEqual(result);
    });

    it('devrait utiliser "anonymous" si req.user est absent', async () => {
      const reqSansUser = {} as Request & { user?: { sub: string } };
      mockGreAGreService.validate.mockResolvedValue({});

      await controller.validate(MOCK_DEMANDE_ID, validateDto, reqSansUser);

      expect(service.validate).toHaveBeenCalledWith(
        MOCK_DEMANDE_ID,
        validateDto,
        'anonymous',
      );
    });

    it('devrait propager les exceptions levées par le service', async () => {
      mockGreAGreService.validate.mockRejectedValue(
        new Error('Demande non trouvée'),
      );
      await expect(
        controller.validate(MOCK_DEMANDE_ID, validateDto, mockReq),
      ).rejects.toThrow('Demande non trouvée');
    });
  });
});
