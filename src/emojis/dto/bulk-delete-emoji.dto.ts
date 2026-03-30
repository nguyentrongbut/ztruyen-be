// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

// ** Class validator
import { IsArray, IsMongoId, ArrayNotEmpty } from 'class-validator';

export class BulkDeleteEmojiDto {
  @ApiProperty({ example: ['id1', 'id2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}