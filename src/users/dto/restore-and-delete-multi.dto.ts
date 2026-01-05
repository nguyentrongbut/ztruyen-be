// ** Class Validator
import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
} from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class RestoreAndDeleteMultiDto {
  @ApiProperty({
    type: [String],
    example: [
      '695b4a8139ebc0e4db1061fa',
      '705b4a8139ebc0e4dd1061fb',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}