// ** NestJS
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// ** Passport
import { Strategy } from 'passport-facebook';

// ** Enums
import { ProviderType } from '../../../configs/enums/user.enum';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_CLIENT_ID'),
      clientSecret: configService.get<string>('FACEBOOK_CLIENT_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
      profileFields: [
        'id',
        'emails',
        'name',
        'displayName',
        'picture.type(large)',
      ],
      scope: ['public_profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      const { id, name, emails, photos, displayName } = profile;

      const email = emails?.[0]?.value || `${id}@facebook.com`;

      const fullName =
        displayName ||
        [name?.givenName, name?.familyName]
          .filter(Boolean)
          .join(' ') ||
        email.split('@')[0] ||
        'User';

      const user = {
        email,
        name: fullName,
        avatar: photos?.[0]?.value || null,
        provider: ProviderType.FACEBOOK,
        providerId: id,
        accessToken,
      };

      return done(null, user);
    } catch (error) {
      console.error('Facebook validate error:', error);
      return done(error, null);
    }
  }
}