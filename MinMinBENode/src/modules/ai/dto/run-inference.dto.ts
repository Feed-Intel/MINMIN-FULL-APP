import { IsObject, IsString } from 'class-validator';

export class RunInferenceDto {
  @IsString()
  model!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
