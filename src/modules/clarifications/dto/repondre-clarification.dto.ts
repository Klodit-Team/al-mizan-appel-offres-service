import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RepondreClarificationDto {
  @ApiProperty({
    description: 'La réponse publique apportée par le service contractant',
    example: 'Le délai a été prolongé de 7 jours réglementaires.',
  })
  @IsNotEmpty()
  @IsString()
  reponse: string;
}
