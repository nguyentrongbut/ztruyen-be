import { IsEmail, IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { ProviderType } from '../../configs/enums/user.enum';

export class CreateUserSocialDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsMongoId({ message: 'Avatar must be a valid ObjectId' })
  avatar: string;

  @IsEnum(ProviderType, {
    message: 'Provider must be one of: local, google, facebook',
  })
  provider: ProviderType;
}