// ** Class Validator
import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// ** Swagger
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'thỏ con xinh xắn' })
  @IsOptional()
  @IsString()
  name?: string;

  // ===== Images =====
  @ApiPropertyOptional({ example: '695b4a8139ebc0e4db1061fa' })
  @IsOptional()
  @IsMongoId()
  avatar?: string;

  @ApiPropertyOptional({ example: '705b4a8139ebc0e4dd1061fb' })
  @IsOptional()
  @IsMongoId()
  avatar_frame?: string;

  @ApiPropertyOptional({ example: '605b4a8139ebc0e4dd1061ff' })
  @IsOptional()
  @IsMongoId()
  cover?: string;

  // ===== Info =====
  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @ApiPropertyOptional({ example: 'male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'I am a cute bunny' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: '1999-05-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  birthday?: string;
}
