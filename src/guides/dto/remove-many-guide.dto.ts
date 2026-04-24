import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, ArrayMinSize } from 'class-validator';

export class RemoveManyGuideDto {
  @ApiProperty({ type: [String], example: ['id1', 'id2'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  ids: string[];
}