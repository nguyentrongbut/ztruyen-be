// ** class-validator
import { IsString, IsEmail, IsOptional, IsEnum, IsNotEmpty, IsMongoId } from 'class-validator';

// ** Configs
import { ProviderType, RoleType } from '../../configs/enums/user.enum';

export class ImportUserDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password?: string;

  @IsOptional()
  age?: number;

  @IsOptional()
  gender?: string;

  @IsOptional()
  bio?: string;

  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @IsOptional()
  @IsEnum(ProviderType)
  provider?: ProviderType;

  @IsOptional()
  birthday?: Date;

  @IsOptional()
  @IsMongoId({ message: 'Avatar must be a valid ObjectId' })
  avatar?: string;

  @IsOptional()
  @IsMongoId({ message: 'Avatar Frame must be a valid ObjectId' })
  avatar_frame?: string;

  @IsOptional()
  @IsMongoId({ message: 'Cover must be a valid ObjectId' })
  cover?: string;
}
