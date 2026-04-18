import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListImagesQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive substring filter on title',
    example: 'sunset',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description:
      'UUID of the first item of the requested page, as returned by nextCursor in the previous response',
    example: '019d9d52-5b20-7938-a06c-4863827044a4',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
