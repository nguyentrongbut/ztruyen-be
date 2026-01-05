// ** Class Validator
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// ** Enums
import { ProviderType, RoleType } from '../../configs/enums/user.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'thỏ con xinh xắn' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'thocon@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  password: string;

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

  @IsOptional()
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

  @ApiPropertyOptional({
    enum: ProviderType,
    example: ProviderType.LOCAL,
  })
  @IsOptional()
  @IsEnum(ProviderType)
  provider?: ProviderType;
}


