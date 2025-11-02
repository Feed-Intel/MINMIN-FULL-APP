import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  caption!: string;

  @IsString()
  image!: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  tags?: string[];
}
