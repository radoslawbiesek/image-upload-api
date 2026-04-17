import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ImageResponseDto } from './image-response.dto';

export class ImagesResponseDto {
  @Expose()
  @Type(() => ImageResponseDto)
  @ApiProperty({ type: [ImageResponseDto], isArray: true })
  declare data: ImageResponseDto[];

  @Expose()
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'UUID of the first item of the next page; null when there are no more pages',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  declare nextCursor: string | null;
}
