import { IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ImportComicDto } from './import-comic.dto';

export class BulkCreateComicDto {
  @ApiProperty({
    type: [ImportComicDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImportComicDto)
  items: ImportComicDto[];
}