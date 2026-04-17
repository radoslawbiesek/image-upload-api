import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ImageResponseDto {
  @Expose()
  @ApiProperty({ example: '019d9d52-5b20-7938-a06c-4863827044a4' })
  declare id: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'https://cdn.example.com/images/foo.jpg',
    nullable: true,
  })
  declare url: string | null;

  @Expose()
  @ApiProperty({ example: 'Sunset over mountains' })
  declare title: string;

  @Expose()
  @ApiProperty({
    enum: ['pending', 'processing', 'ready', 'failed'],
    example: 'pending',
  })
  declare status: string;

  @Expose()
  @ApiProperty({ example: 1920 })
  declare width: number;

  @Expose()
  @ApiProperty({ example: 1080 })
  declare height: number;
}
