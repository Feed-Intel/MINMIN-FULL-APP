import { IsNumber, IsString } from 'class-validator';

export class UpdatePointsDto {
  @IsString()
  accountId!: string;

  @IsNumber()
  delta!: number;
}
