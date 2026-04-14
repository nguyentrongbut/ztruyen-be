import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComicDto {
  @ApiProperty({ example: 'One Piece' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'one-piece' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'https://img.com/one-piece.jpg' })
  @IsOptional()
  @IsString()
  thumb_url?: string;

  @ApiPropertyOptional({
    example: ['Oda Eiichiro'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authors?: string[];

  @ApiPropertyOptional({ example: 'ongoing' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: ['Action', 'Adventure'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ example: 'Chapter 1090' })
  @IsOptional()
  @IsString()
  latest_chapter?: string;

  @ApiPropertyOptional({ example: '/api/chapters/one-piece' })
  @IsOptional()
  @IsString()
  chapter_api_data?: string;

  @ApiPropertyOptional({ example: 'trung' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  rank: number;
}