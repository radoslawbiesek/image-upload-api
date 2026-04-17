import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateImageDto {
  @ApiProperty({ example: 'Sunset over mountains' })
  @IsString()
  @IsNotEmpty()
  declare title: string;

  @ApiProperty({ example: 1920 })
  @IsInt()
  @Min(1)
  declare width: number;

  @ApiProperty({ example: 1080 })
  @IsInt()
  @Min(1)
  declare height: number;
}
