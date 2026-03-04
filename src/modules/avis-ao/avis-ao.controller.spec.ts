import { Test, TestingModule } from '@nestjs/testing';
import { AvisAoController } from './avis-ao.controller';
import { AvisAoService } from './avis-ao.service';
import { CreateAvisAoDto } from './dto/create-avis-ao.dto';
import { UpdateAvisAoDto } from './dto/update-avis-ao.dto';
import { TypeAvis } from '@prisma/client';

describe('AvisAoController', () => {
    let controller: AvisAoController;
    let service: AvisAoService;

    const mockAvis = {
        id: 'test-id',
        aoId: 'ao-id',
        typeAvis: TypeAvis.PUBLICATION,
        contenuBomop: 'Contenu test',
        datePublication: new Date(),
        publieBomop: true,
        publiePresse: false,
    };

    const mockAvisAoService = {
        create: jest.fn().mockResolvedValue(mockAvis),
        findAll: jest.fn().mockResolvedValue([mockAvis]),
        findOne: jest.fn().mockResolvedValue(mockAvis),
        update: jest.fn().mockResolvedValue({ ...mockAvis, contenuBomop: 'Updated' }),
        remove: jest.fn().mockResolvedValue(mockAvis),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AvisAoController],
            providers: [
                {
                    provide: AvisAoService,
                    useValue: mockAvisAoService,
                },
            ],
        }).compile();

        controller = module.get<AvisAoController>(AvisAoController);
        service = module.get<AvisAoService>(AvisAoService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('devrait créer un avis', async () => {
            const dto: CreateAvisAoDto = {
                aoId: 'ao-id',
                typeAvis: TypeAvis.PUBLICATION,
                contenuBomop: 'Contenu test',
                datePublication: new Date().toISOString(),
            };

            const result = await controller.create(dto);
            expect(service.create).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockAvis);
        });
    });

    describe('findAll', () => {
        it('devrait retourner un tableau d\'avis', async () => {
            const result = await controller.findAll();
            expect(service.findAll).toHaveBeenCalled();
            expect(result).toEqual([mockAvis]);
        });
    });

    describe('findOne', () => {
        it('devrait retourner un avis', async () => {
            const result = await controller.findOne('test-id');
            expect(service.findOne).toHaveBeenCalledWith('test-id');
            expect(result).toEqual(mockAvis);
        });
    });

    describe('update', () => {
        it('devrait mettre à jour un avis', async () => {
            const dto: UpdateAvisAoDto = { contenuBomop: 'Updated' };
            const result = await controller.update('test-id', dto);
            expect(service.update).toHaveBeenCalledWith('test-id', dto);
            expect(result.contenuBomop).toEqual('Updated');
        });
    });

    describe('remove', () => {
        it('devrait supprimer un avis', async () => {
            const result = await controller.remove('test-id');
            expect(service.remove).toHaveBeenCalledWith('test-id');
            expect(result).toEqual(mockAvis);
        });
    });
});
