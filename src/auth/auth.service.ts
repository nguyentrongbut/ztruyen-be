// ** NestJs
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// ** Services
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

// ** Interface
import {
  IUser,
  IUserByFacebook,
  IUserByGoogle,
} from '../users/users.interface';

// ** ms
import ms from 'ms';

// ** DTO
import { RegisterUserDto } from './dto/register-user.dto';

// ** Utils
import { formatExpireTime } from '../utils/timeFormatter';

// ** Enums
import { ProviderType } from '../configs/enums/user.enum';

// ** Message
import { USERS_MESSAGES } from '../configs/messages/user.message';
import { AUTH_MESSAGES } from '../configs/messages/auth.message';

// ** Service
import { ImagesService } from '../images/images.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly imageService: ImagesService,
  ) {}

  async login(user: IUser) {
    const { _id, name, role, email } = user;

    await this.usersService.ensureNotDeleted(_id);

    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      name,
      email,
      role,
    };

    const refresh_token = await this.createRefreshToken(payload);

    // update refresh token in db
    await this.usersService.updateUserToken(refresh_token, _id);

    return {
      accessToken: this.jwtService.sign(payload),
      refresh_token,
      user: { _id, name, email, role },
    };
  }

  async socialLogin(
    userSocial: IUserByGoogle | IUserByFacebook,
    provider: ProviderType,
  ) {
    if (!userSocial) {
      throw new BadRequestException(AUTH_MESSAGES.LOGIN_FAILED);
    }

    const { email, name, avatar } = userSocial;

    let user = await this.usersService.findOneByEmail(email);

    if (user?.isDeleted) {
      throw new ForbiddenException(USERS_MESSAGES.DELETED_OR_BANNED);
    }

    if (!user) {
      let avatarImageId: string | null = null;

      if (avatar) {
        const slug = `avatar-${provider}-${Date.now()}`;

        const image = await this.imageService.create(null, slug, avatar);

        avatarImageId = image._id;
      }

      user = await this.usersService.createUserSocial({
        email,
        name,
        avatar: avatarImageId,
        provider,
      });
    }

    const { _id, role } = user;

    const payload = {
      sub: `token login ${provider}`,
      iss: 'from server',
      _id,
      name,
      email,
      role,
    };

    const refreshToken = await this.createRefreshToken(payload);
    const accessToken = this.jwtService.sign(payload);

    await this.usersService.updateUserToken(refreshToken, _id.toString());

    return {
      refreshToken,
      redirectUrl: `${this.configService.get(
        'LOGIN_SOCIAL_RETURN_URL',
      )}${accessToken}`,
    };
  }

  async register(user: RegisterUserDto) {
    const { cfToken, ...userData } = user;
    // @ts-ignore
    const newUser = await this.usersService.register(userData);
    return {
      _id: newUser._id,
      createdAt: newUser?.createdAt,
    };
  }

  logout(user: IUser) {
    return this.usersService.updateUserToken('', user._id);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return;
    }

    if (user.provider !== 'local') {
      return;
    }

    if (!user.password) {
      return;
    }

    const token = await this.usersService.setResetToken(user.email);

    const resetLink = `${process.env.FRONTEND_URL}/quen-mat-khau?token=${token}`;
    const expireTime = formatExpireTime(
      this.configService.get<string>('EMAIL_RESET_PASSWORD_EXPIRE'),
    );

    await this.emailService.sendResetPasswordEmail(
      user.email,
      user.name,
      resetLink,
      expireTime,
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.verifyResetToken(token);
    await this.usersService.updatePassword(user._id.toString(), newPassword);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid === true) return user;
    }
    return null;
  }

  async createRefreshToken(payload) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRE')) / 1000,
    });
  }

  async processNewToken(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException(AUTH_MESSAGES.REFRESH_TOKEN_MISSING);
    }

    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN'),
      });

      const user = await this.usersService.findUserByToken(refreshToken);
      if (!user)
        throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_FAILED);

      const { _id, name, email, role } = user;
      const payload = {
        sub: 'token refresh',
        iss: 'from server',
        _id,
        name,
        email,
        role,
      };

      const newRefreshToken = await this.createRefreshToken(payload);
      const newAccessToken = this.jwtService.sign(payload);

      // update refresh token in db
      await this.usersService.updateUserToken(newRefreshToken, _id.toString());

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: { _id, name, email, role },
      };
    } catch (error) {
      throw new UnauthorizedException(AUTH_MESSAGES.REFRESH_TOKEN_FAILED);
    }
  }
}
