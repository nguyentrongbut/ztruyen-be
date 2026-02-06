// ** Class Validator
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// ** Swagger
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFrameDto {
  @ApiProperty({ example: 'khung thỏ con xinh xắn' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '705b4a8139ebc0e4dd1061fb' })
  @IsOptional()
  @IsMongoId()
  image?: string;
}
