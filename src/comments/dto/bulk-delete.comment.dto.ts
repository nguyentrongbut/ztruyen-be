// ** Nestjs
import { ApiProperty } from '@nestjs/swagger';

// ** Class validator
import { IsArray, IsMongoId, ArrayNotEmpty } from 'class-validator';

export class BulkDeleteCommentDto {
  @ApiProperty({
    example: ['664f1a2b3c4d5e6f7a8b9c0d', '664f1a2b3c4d5e6f7a8b9c0e'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}