// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

// ** Class validator
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

// ** Enum
import { EmojiType } from '../../configs/enums/emoji.enum';

export class CreateEmojiCategoryDto {
  @ApiProperty({ example: 'Mèo con' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, example: '664f...' })
  @IsMongoId()
  image: string;


  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  order?: number;
}