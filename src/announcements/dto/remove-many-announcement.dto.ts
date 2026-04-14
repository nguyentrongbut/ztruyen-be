import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, ArrayMinSize } from 'class-validator';

export class RemoveManyAnnouncementDto {
  @ApiProperty({ example: ['id1', 'id2', 'id3'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  ids: string[];
}