import { IsArray, ArrayNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteComicDto {
  @ApiProperty({
    description: 'Danh sách ID truyện cần xóa',
    example: [
      '661a1f2c1234567890abc001',
      '661a1f2c1234567890abc002',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}