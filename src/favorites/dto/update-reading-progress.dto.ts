// ** Nestjs
import { ApiProperty } from '@nestjs/swagger';

// ** Class validator
import { IsNumber, IsString, Min } from 'class-validator';

export class UpdateReadingProgressDto {
  @ApiProperty({ example: 'one-piece' })
  @IsString()
  comic_slug: string;

  @ApiProperty({ example: 'chapter-1050' })
  @IsString()
  chapter_id: string;

  @ApiProperty({ example: 'Chapter 1050' })
  @IsString()
  chapter_name: string;

  @ApiProperty({ example: '/truyen/one-piece/chapter-1050' })
  @IsString()
  path: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  image_name: number;
}