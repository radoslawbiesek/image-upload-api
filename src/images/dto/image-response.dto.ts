import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ImageResponseDto {
  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  declare id: string;

  @Expose()
  @ApiProperty({ example: 'https://cdn.example.com/images/foo.jpg' })
  declare url: string;

  @Expose()
  @ApiProperty({ example: 'Sunset over mountains' })
  declare title: string;

  @Expose()
  @ApiProperty({ example: 1920 })
  declare width: number;

  @Expose()
  @ApiProperty({ example: 1080 })
  declare height: number;
}
