import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  topic?: string;
}
