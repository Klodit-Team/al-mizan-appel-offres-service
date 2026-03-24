import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GreAGreService } from './gre-a-gre.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';
import { SubmitGreAGreDto } from './dto/submit-gre-a-gre.dto';
import { ValidateGreAGreDto } from './dto/validate-gre-a-gre.dto';
import {
  DecisionControleurGreAGre,
  TypeJustificationGreAGre,
  TypeProcedure,
} from '@prisma/client';

// ─── Constantes de test ─────────────────────────────────────────────────────
const MOCK_AO_ID = '00000000-0000-0000-0000-000000000001';
const MOCK_DEMANDE_ID = '00000000-0000-0000-0000-000000000002';
const MOCK_CONTROLEUR_ID = '12345678-1234-1234-1234-1234567890ab';
const MOCK_GAG_ID = '00000000-0000-0000-0000-000000000003';

// ─── Données fictives réutilisables ─────────────────────────────────────────
const mockAo = {
  id: MOCK_AO_ID,
  typeProcedure: TypeProcedure.GRE_A_GRE,
  serviceContractantId: 'sc-789',
  statut: 'BROUILLON',
};

const mockDemande = {
  id: MOCK_DEMANDE_ID,
  aoId: MOCK_AO_ID,
  statut: 'SOUMISE',
  createdAt: new Date('2026-01-01'),
  serviceContractantId: 'sc-789',
  evaluationsIa: [],
};

const submitDto: SubmitGreAGreDto = {
  justifications: [
    {
      type_justification: TypeJustificationGreAGre.URGENCE,
      description: 'Situation d urgence exceptionnelle',
    },
  ],
};

const validateDto: ValidateGreAGreDto = {
  decision: DecisionControleurGreAGre.ACCEPTER,
  motif: 'Dossier complet et conforme',
};

// ─── Mock PrismaService ─────────────────────────────────────────────────────
const mockPrismaService = {
  appelOffres: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  demandeGreAGre: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  evaluationIaGreAGre: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

// ─── Mock AoEventsPublisher ─────────────────────────────────────────────────
const mockPublisher = {
  publishGreAGreSubmitted: jest.fn(),
  publishGreAGreValidated: jest.fn(),
};

// ─── Suite de tests ─────────────────────────────────────────────────────────
describe('GreAGreService', () => {
  let service: GreAGreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GreAGreService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AoEventsPublisher, useValue: mockPublisher },
      ],
    }).compile();

    service = module.get<GreAGreService>(GreAGreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── submit() ───────────────────────────────────────────────────────────
  describe('submit()', () => {
    it('devrait créer une demande et émettre un événement RabbitMQ', async () => {
      const createdDemande = { ...mockDemande, id: MOCK_GAG_ID };
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue(null); // pas de doublon
      mockPrismaService.demandeGreAGre.create.mockResolvedValue(createdDemande);

      const result = await service.submit(MOCK_AO_ID, submitDto);

      expect(mockPrismaService.appelOffres.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_AO_ID },
      });
      // Vérifie la structure exacte des données persistées
      expect(mockPrismaService.demandeGreAGre.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aoId: MOCK_AO_ID,
          statut: 'SOUMISE',
          justifications: {
            create: expect.arrayContaining([
              expect.objectContaining({
                ordre: 1,
                description: submitDto.justifications[0].description,
                typeJustification:
                  submitDto.justifications[0].type_justification,
              }),
            ]),
          },
        }),
      });
      expect(mockPublisher.publishGreAGreSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({ aoId: MOCK_AO_ID, gagId: MOCK_GAG_ID }),
      );
      expect(result.id).toEqual(MOCK_GAG_ID);
      expect(result.aoId).toEqual(MOCK_AO_ID);
    });

    it("devrait lever NotFoundException si l'AO n'existe pas", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(null);

      await expect(service.submit(MOCK_AO_ID, submitDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("devrait lever BadRequestException si l'AO n'est pas de type GRE_A_GRE", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue({
        ...mockAo,
        typeProcedure: TypeProcedure.AO_OUVERT,
      });

      await expect(service.submit(MOCK_AO_ID, submitDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait lever BadRequestException si une demande existe déjà pour cet AO', async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue(
        mockDemande,
      ); // doublon !

      await expect(service.submit(MOCK_AO_ID, submitDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── validate() ─────────────────────────────────────────────────────────
  describe('validate()', () => {
    const mockDecision = {
      id: 'decision-001',
      demandeId: MOCK_DEMANDE_ID,
      dateDecision: new Date('2026-01-02'),
    };

    // Mock du client Prisma injecté dans le callback de $transaction
    const mockTx = {
      decisionGreAGre: { create: jest.fn() },
      demandeGreAGre: { update: jest.fn() },
      appelOffres: { update: jest.fn() },
    };

    beforeEach(() => {
      // $transaction exécute réellement le callback avec mockTx au lieu de le court-circuiter
      const txImpl = (
        fn: (tx: typeof mockTx) => Promise<unknown>,
      ): Promise<unknown> => fn(mockTx);
      mockPrismaService.$transaction.mockImplementation(txImpl);
    });

    it("devrait accepter une demande, mettre à jour l'AO et émettre RabbitMQ", async () => {
      const updatedDemande = { ...mockDemande, statut: 'ACCEPTEE' };
      const updatedAo = { ...mockAo, statut: 'EN_COURS' };

      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue(
        mockDemande,
      );
      mockTx.decisionGreAGre.create.mockResolvedValue(mockDecision);
      mockTx.demandeGreAGre.update.mockResolvedValue(updatedDemande);
      mockTx.appelOffres.update.mockResolvedValue(updatedAo);

      const result = await service.validate(
        MOCK_DEMANDE_ID,
        validateDto,
        MOCK_CONTROLEUR_ID,
      );

      expect(mockPrismaService.demandeGreAGre.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: MOCK_DEMANDE_ID } }),
      );
      // Vérifie que la décision est créée avec les bonnes données dans la transaction
      expect(mockTx.decisionGreAGre.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          demandeId: MOCK_DEMANDE_ID,
          controleurId: MOCK_CONTROLEUR_ID,
          decisionFinale: DecisionControleurGreAGre.ACCEPTER,
          motifDecision: validateDto.motif,
        }),
      });
      // Vérifie la mise à jour de la demande vers ACCEPTEE
      expect(mockTx.demandeGreAGre.update).toHaveBeenCalledWith({
        where: { id: MOCK_DEMANDE_ID },
        data: { statut: 'ACCEPTEE' },
      });
      // Vérifie la mise à jour de l'AO vers EN_COURS
      expect(mockTx.appelOffres.update).toHaveBeenCalledWith({
        where: { id: MOCK_AO_ID },
        data: { statut: 'EN_COURS' },
      });
      expect(mockPublisher.publishGreAGreValidated).toHaveBeenCalledWith(
        expect.objectContaining({
          gagId: updatedDemande.id,
          aoId: updatedDemande.aoId,
          decision: validateDto.decision,
        }),
      );
      expect(result).toEqual({
        decisionEntity: mockDecision,
        updatedDemande,
        updatedAo,
      });
    });

    it("devrait rejeter une demande et passer l'AO au statut ANNULE", async () => {
      const rejectDto: ValidateGreAGreDto = {
        decision: DecisionControleurGreAGre.REJETER,
        motif: 'Dossier non conforme à l Art. 41',
      };
      const updatedDemande = { ...mockDemande, statut: 'REJETEE' };
      const updatedAo = { ...mockAo, statut: 'ANNULE' };

      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue(
        mockDemande,
      );
      mockTx.decisionGreAGre.create.mockResolvedValue(mockDecision);
      mockTx.demandeGreAGre.update.mockResolvedValue(updatedDemande);
      mockTx.appelOffres.update.mockResolvedValue(updatedAo);

      await service.validate(MOCK_DEMANDE_ID, rejectDto, MOCK_CONTROLEUR_ID);

      expect(mockTx.demandeGreAGre.update).toHaveBeenCalledWith({
        where: { id: MOCK_DEMANDE_ID },
        data: { statut: 'REJETEE' },
      });
      expect(mockTx.appelOffres.update).toHaveBeenCalledWith({
        where: { id: MOCK_AO_ID },
        data: { statut: 'ANNULE' },
      });
    });

    it("devrait lever NotFoundException si la demande n'existe pas", async () => {
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue(null);

      await expect(
        service.validate(MOCK_DEMANDE_ID, validateDto, MOCK_CONTROLEUR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait lever BadRequestException si la demande est déjà clôturée (ACCEPTEE)', async () => {
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue({
        ...mockDemande,
        statut: 'ACCEPTEE',
        evaluationsIa: [],
      });

      await expect(
        service.validate(MOCK_DEMANDE_ID, validateDto, MOCK_CONTROLEUR_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait lever BadRequestException si la demande est déjà clôturée (REJETEE)', async () => {
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue({
        ...mockDemande,
        statut: 'REJETEE',
        evaluationsIa: [],
      });

      await expect(
        service.validate(MOCK_DEMANDE_ID, validateDto, MOCK_CONTROLEUR_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait passer correspondIa=false à la transaction quand aucune évaluation IA n'existe", async () => {
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue({
        ...mockDemande,
        evaluationsIa: [], // aucune IA
      });
      mockTx.decisionGreAGre.create.mockResolvedValue(mockDecision);
      mockTx.demandeGreAGre.update.mockResolvedValue({
        ...mockDemande,
        statut: 'ACCEPTEE',
      });
      mockTx.appelOffres.update.mockResolvedValue({
        ...mockAo,
        statut: 'EN_COURS',
      });

      await service.validate(MOCK_DEMANDE_ID, validateDto, MOCK_CONTROLEUR_ID);

      // La valeur correspondIa doit être false et evaluationIaId null
      expect(mockTx.decisionGreAGre.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          correspondIa: false,
          evaluationIaId: null,
        }),
      });
    });

    it('devrait passer correspondIa=true quand la décision correspond à la recommandation IA', async () => {
      const mockEvalIa = { id: 'eval-ia-001', recommandation: 'ACCEPTER' };
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue({
        ...mockDemande,
        evaluationsIa: [mockEvalIa],
      });
      mockTx.decisionGreAGre.create.mockResolvedValue(mockDecision);
      mockTx.demandeGreAGre.update.mockResolvedValue({
        ...mockDemande,
        statut: 'ACCEPTEE',
      });
      mockTx.appelOffres.update.mockResolvedValue({
        ...mockAo,
        statut: 'EN_COURS',
      });

      await service.validate(MOCK_DEMANDE_ID, validateDto, MOCK_CONTROLEUR_ID);

      // correspondIa=true car decision ACCEPTER === recommandation IA ACCEPTER
      expect(mockTx.decisionGreAGre.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          correspondIa: true,
          evaluationIaId: 'eval-ia-001',
        }),
      });
    });
  });

  // ─── recordIaScore() ────────────────────────────────────────────────────
  describe('recordIaScore()', () => {
    const mockIaScore = {
      gagId: MOCK_DEMANDE_ID,
      modeleIa: 'gpt-4',
      scoreConformite: 85,
      recommandation: 'ACCEPTER' as any,
      justificationIa: 'Dossier conforme',
      confianceScore: 90,
    };

    it('devrait enregistrer le score IA et mettre à jour le statut en EN_ANALYSE_IA', async () => {
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue(mockDemande);
      mockPrismaService.evaluationIaGreAGre.create.mockResolvedValue({ id: 'eval-1', ...mockIaScore });

      const result = await service.recordIaScore(mockIaScore);

      expect(mockPrismaService.evaluationIaGreAGre.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          demandeId: MOCK_DEMANDE_ID,
          modeleIa: 'gpt-4',
          scoreConformite: 85,
          recommandation: 'ACCEPTER',
        })
      });

      expect(mockPrismaService.demandeGreAGre.update).toHaveBeenCalledWith({
        where: { id: MOCK_DEMANDE_ID },
        data: { statut: 'EN_ANALYSE_IA' }
      });

      expect(result.id).toBe('eval-1');
    });

    it('devrait lever NotFoundException si la demande n existe pas', async () => {
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue(null);

      await expect(service.recordIaScore(mockIaScore)).rejects.toThrow(NotFoundException);
    });

    it('devrait lever BadRequestException si la demande est déjà clôturée', async () => {
      mockPrismaService.demandeGreAGre.findUnique.mockResolvedValue({
        ...mockDemande,
        statut: 'ACCEPTEE'
      });

      await expect(service.recordIaScore(mockIaScore)).rejects.toThrow(BadRequestException);
    });
  });
});
