// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

// ** Class validator
import { IsEnum, IsMongoId, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

// ** Enum
import { EmojiType } from '../../configs/enums/emoji.enum';

export class CreateEmojiDto {
  @ApiProperty({ example: 'pepe_cry' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: EmojiType, example: EmojiType.IMAGE })
  @IsEnum(EmojiType)
  type: EmojiType;

  @ApiProperty({ required: false, example: '664f...' })
  @ValidateIf(o => o.type === EmojiType.IMAGE)
  @IsMongoId()
  image?: string;

  @ApiProperty({ required: false, example: '( ͡° ͜ʖ ͡°)' })
  @ValidateIf(o => o.type === EmojiType.TEXT)
  @IsString()
  @IsNotEmpty()
  text?: string;

  @ApiProperty({ example: '664f...' })
  @IsMongoId()
  category: string;
}