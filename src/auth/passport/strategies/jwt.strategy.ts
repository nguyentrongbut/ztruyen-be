// ** NestJs
import { PassportStrategy } from '@nestjs/passport';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Passport
import { ExtractJwt, Strategy } from 'passport-jwt';

// ** Interfaces
import { IUser } from '../../../users/users.interface';
import { UsersService } from '../../../users/users.service';

// ** Message
import { USERS_MESSAGES } from '../../../configs/messages/user.message';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN'),
    });
  }

  async validate(payload: IUser) {
    const { _id } = payload;

    const user = await this.usersService.findOne(_id);

    if (!user) {
      throw new UnauthorizedException(USERS_MESSAGES.DELETED_OR_BANNED);
    }

    if (user.isDeleted) {
      throw new ForbiddenException(USERS_MESSAGES.DELETED_OR_BANNED);
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
