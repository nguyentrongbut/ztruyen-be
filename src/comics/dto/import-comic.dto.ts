import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateComicDto } from './create-comic.dto';

export class ImportComicDto extends CreateComicDto {
  @ApiPropertyOptional({
    example: '2026-04-12T07:36:25.186Z',
  })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}