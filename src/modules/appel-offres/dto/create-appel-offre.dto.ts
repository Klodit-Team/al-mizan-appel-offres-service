import { ApiProperty } from '@nestjs/swagger';
import { TypeProcedure } from '@prisma/client';
import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsNumber,
    IsPositive,
    IsDateString,
    IsUUID
} from 'class-validator';

/**
 * Le DTO (Data Transfer Object) est un "moule" ou "filtre".
 * Il définit exactement à quoi doit ressembler le JSON que l'utilisateur 
 * (le frontend) nous envoie dans sa requête POST (Création).
 */
export class CreateAppelOffreDto {

    @ApiProperty({ description: "La référence unique (ex: AO-2025-001)" })
    @IsString({ message: "La référence doit être une chaîne de caractères" })
    @IsNotEmpty({ message: "La référence ne peut pas être vide" })
    reference: string;

    @ApiProperty({ description: "L'objet ou titre du marché", example: "Acquisition de PC Portables" })
    @IsString()
    @IsNotEmpty()
    objet: string;

    @ApiProperty({ enum: TypeProcedure, description: "Procédure ouverte, restreinte, gré-à-gré..." })
    @IsEnum(TypeProcedure, { message: "Le type de procédure n'est pas valide" })
    @IsNotEmpty()
    typeProcedure: TypeProcedure;

    @ApiProperty({ description: "Montant estimatif en DZD", example: 5000000 })
    @IsNumber({}, { message: "Le montant doit être un nombre" })
    @IsPositive({ message: "Le montant doit être strictement positif (>0)" })
    @IsNotEmpty()
    montantEstime: number;

    @ApiProperty({ description: "Date/heure limite de dépôt des dossiers (format ISO8601)", example: "2025-12-31T12:00:00Z" })
    @IsDateString({}, { message: "La date limite de soumission doit être une date valide (ISO-8601)" })
    @IsNotEmpty()
    dateLimiteSoumission: string;

    @ApiProperty({ description: "Date/heure limite pour acheter/retirer le CDC", example: "2025-12-15T12:00:00Z" })
    @IsDateString({}, { message: "La date limite de retrait doit être valide" })
    @IsNotEmpty()
    dateLimiteRetraitCdc: string;

    @ApiProperty({ description: "ID de l'utilisateur ou du service contractant (Microservice Auth/Users)", example: "123e4567-e89b-12d3-a456-426614174000" })
    @IsUUID("4", { message: "L'ID du service contractant doit être un UUID valide" })
    @IsNotEmpty()
    serviceContractantId: string;

    @ApiProperty({ description: "La Wilaya concernée", example: "Alger" })
    @IsString()
    @IsNotEmpty()
    wilaya: string;

    @ApiProperty({ description: "Domaine d'activité du marché", example: "Informatique & High-Tech" })
    @IsString()
    @IsNotEmpty()
    secteurActivite: string;
}
