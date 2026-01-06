// ** Class Validator
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId, IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// ** Swagger
import { ApiPropertyOptional } from '@nestjs/swagger';

// ** Enums
import { RoleType } from '../../configs/enums/user.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'thỏ con xinh xắn' })
  @IsOptional()
  @IsString()
  name?: string;

  // ===== Images (ObjectId) =====
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

  @ApiPropertyOptional({
    enum: RoleType,
    example: RoleType.USER,
  })
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

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
