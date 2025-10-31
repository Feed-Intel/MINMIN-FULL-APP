import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsArray()
  @IsString({ each: true })
  tokens!: string[];

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
