// ** NestJs
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

// ** Passport
import { Strategy } from 'passport-local';

// ** Services
import { AuthService } from '../../auth.service';

// ** Messages
import { AUTH_MESSAGES } from '../../../configs/messages/auth.message';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    return user;
  }
}
