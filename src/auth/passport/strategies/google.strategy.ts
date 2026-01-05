// ** NestJs
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Passport
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

// ** Enums
import { ProviderType } from '../../../configs/enums/user.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: name?.givenName + ' ' + name?.familyName,
      avatar: photos?.[0]?.value,
      provider: ProviderType.GOOGLE,
      accessToken,
    };
    done(null, user);
  }
}
