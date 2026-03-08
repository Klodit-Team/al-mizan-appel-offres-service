import { DecisionControleurGreAGre } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateGreAGreDto {
  @ApiProperty({ enum: DecisionControleurGreAGre })
  @IsEnum(DecisionControleurGreAGre)
  decision: DecisionControleurGreAGre;

  @ApiProperty({
    description:
      "Raison ou motif explicite du refus ou de l'acceptation par le contrôleur.",
  })
  @IsString()
  @IsNotEmpty()
  motif: string;
}
