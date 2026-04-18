import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const FIT_OPTIONS = ['cover', 'contain'] as const;
export type FitOption = (typeof FIT_OPTIONS)[number];

export class CreateImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  declare file: Express.Multer.File;

  @ApiProperty({ example: 'Sunset over mountains' })
  @IsString()
  @IsNotEmpty()
  declare title: string;

  @ApiProperty({ example: 1920 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare width: number;

  @ApiProperty({ example: 1080 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declare height: number;

  @ApiPropertyOptional({ enum: FIT_OPTIONS, default: 'cover' })
  @IsOptional()
  @IsIn(FIT_OPTIONS)
  fit: FitOption = 'cover';
}
