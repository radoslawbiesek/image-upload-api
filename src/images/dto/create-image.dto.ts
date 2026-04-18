import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

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
}
