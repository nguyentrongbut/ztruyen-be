// ** NestJS
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Passport
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-discord';
import { VerifyCallback } from 'passport-google-oauth20';

// ** Enums
import { ProviderType } from '../../../configs/enums/user.enum';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('DISCORD_CLIENT_ID'),
      clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET'),
      callbackURL: configService.get<string>('DISCORD_CALLBACK_URL'),
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, username, email, avatar, global_name } = profile as any;

      const safeEmail = email || `${id}@discord.com`;

      const fullName =
        global_name ||
        username ||
        safeEmail.split('@')[0] ||
        'User';

      const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;


      const user = {
        email: safeEmail,
        name: fullName,
        avatar: avatarUrl,
        provider: ProviderType.DISCORD,
        providerId: id,
        accessToken,
      };

      return done(null, user);
    } catch (error) {
      console.error('Discord validate error:', error);
      return done(error, null);
    }
  }
}