// ** Nestjs
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
    const { id, username, email, avatar, global_name } = profile;

    // Discord có thể cung cấp global_name (tên hiển thị) hoặc username
    const displayName = global_name || username;

    // Xây dựng URL avatar nếu có
    let avatarUrl: string | null = null;
    if (avatar) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
    }

    const user = {
      email: email,
      name: displayName,
      avatar: avatarUrl,
      provider: ProviderType.DISCORD,
      discordId: id,
      accessToken,
    };

    done(null, user);
  }
}