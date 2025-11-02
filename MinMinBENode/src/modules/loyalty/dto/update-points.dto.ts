import { IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePointsDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsIn(['earning', 'redemption'])
  transactionType!: 'earning' | 'redemption';

  @IsNumber()
  delta!: number;
}
