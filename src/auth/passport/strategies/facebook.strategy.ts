// ** NeetJs
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
      clientID: configService.get('FACEBOOK_CLIENT_ID'),
      clientSecret: configService.get('FACEBOOK_CLIENT_SECRET'),
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL'),
      profileFields: [
        'id',
        'emails',
        'name',
        'picture.type(large)',
        'birthday',
        'gender',
      ],
      scope: ['public_profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      email: emails?.[0]?.value || `${id}@facebook.com`,
      name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
      avatar: photos?.[0]?.value,
      provider: ProviderType.FACEBOOK,
      accessToken,
    };
    done(null, user);
  }
}
