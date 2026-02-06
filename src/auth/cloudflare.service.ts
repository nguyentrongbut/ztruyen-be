// ** Nestjs
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** axios
import axios from 'axios';

@Injectable()
export class CloudflareService {
  constructor(private configService: ConfigService) {}

  async verifyTurnstile(token: string, ip?: string) {
    if (!token) {
      throw new ForbiddenException('Turnstile token missing');
    }

    const secret = this.configService.get<string>(
      'CLOUDFLARE_TURNSTILE_SECRET',
    );

    const { data } = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret,
        response: token,
        remoteip: ip,
      },
    );

    if (!data.success) {
      throw new ForbiddenException('Bot detected');
    }
  }
}
