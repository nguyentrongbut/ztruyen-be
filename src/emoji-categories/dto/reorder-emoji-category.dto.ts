// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

// ** Class validator
import { IsArray, IsMongoId, ArrayNotEmpty } from 'class-validator';

export class ReorderEmojiCategoryDto {
  @ApiProperty({
    example: ['id1', 'id2', 'id3'],
    description: 'Danh sách ID theo thứ tự mới',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}