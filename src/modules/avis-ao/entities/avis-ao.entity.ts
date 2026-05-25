import { ApiProperty } from '@nestjs/swagger';
import { TypeAvis } from '@prisma/client';

export class AvisAo {
  @ApiProperty() id: string;
  @ApiProperty() aoId: string;
  @ApiProperty({ enum: TypeAvis }) typeAvis: TypeAvis;
  @ApiProperty() contenuBomop: string;
  @ApiProperty() datePublication: Date;
  @ApiProperty() publieBomop: boolean;
  @ApiProperty() publiePresse: boolean;
}
