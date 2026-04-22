// ** NestJS
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
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { emails, photos, displayName, name } = profile;

      const email = emails?.[0]?.value;

      const fullName =
        displayName ||
        [name?.givenName, name?.familyName]
          .filter(Boolean)
          .join(' ') ||
        email?.split('@')[0] ||
        'User';

      const user = {
        email,
        name: fullName,
        avatar: photos?.[0]?.value || null,
        provider: ProviderType.GOOGLE,
        providerId: profile.id,
        accessToken,
      };

      return done(null, user);
    } catch (error) {
      console.error('Google validate error:', error);
      return done(error, null);
    }
  }
}