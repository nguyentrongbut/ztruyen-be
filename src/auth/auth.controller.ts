// ** NestJs
import { ConfigService } from '@nestjs/config';

// ** Express
import { Response, Request } from 'express';

// ** Controllers
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

// ** Services
import { AuthService } from './auth.service';

// ** DTO
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// ** Decorators
import { Public, ResponseMessage, User } from '../decorator/customize';

// ** Guards
import { LocalAuthGuard } from './passport/guards/local-auth.guard';

import { GoogleAuthGuard } from './passport/guards/google-auth.guard';
import { FacebookAuthGuard } from './passport/guards/facebook-auth.guard';

// ** Interface
import { IUser } from '../users/users.interface';

// ** Messages
import { AUTH_MESSAGES } from '../configs/messages/auth.message';

// ** Enums
import { ProviderType } from '../configs/enums/user.enum';

// ** ms
import ms from 'ms';

// ** Swagger
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage(AUTH_MESSAGES.LOGIN_SUCCESS)
  @ApiOperation({
    summary: 'Đăng nhập người dùng',
  })
  @ApiConsumes('application/json')
  @Post('login')
  async handleLogin(
    @Body() _: LoginDto,
    @Req() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refresh_token, user } = await this.authService.login(
      req.user,
    );

    // save refresh token in cookie
    response.cookie('ZTC_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRE')),
    });

    return { access_token: accessToken, user };
  }

  @Public()
  @Get('google')
  @ResponseMessage(AUTH_MESSAGES.SOCIAL_LOGIN_SUCCESS)
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Đăng nhập bằng Google',
    description:
      'Redirect người dùng sang trang đăng nhập Google OAuth. Sau khi đăng nhập thành công sẽ callback về backend.',
  })
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth() {
  }

  @Public()
  @Get('facebook')
  @ResponseMessage(AUTH_MESSAGES.SOCIAL_LOGIN_SUCCESS)
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({
    summary: 'Đăng nhập bằng Facebook',
    description:
      'Redirect người dùng sang trang đăng nhập Facebook OAuth. Sau khi đăng nhập thành công sẽ callback về backend.',
  })
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async login() {
  }

  @Public()
  @Get('google/callback')
  @ResponseMessage(AUTH_MESSAGES.SOCIAL_LOGIN_SUCCESS)
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthRedirect(@Req() req, @Res() response: Response) {
    const { refreshToken, redirectUrl } = await this.authService.socialLogin(
      req.user,
      ProviderType.GOOGLE,
    );

    // save refresh token in cookie
    response.cookie('ZTC_token', refreshToken, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRE')),
    });

    return response.redirect(redirectUrl);
  }

  @Public()
  @Get('facebook/callback')
  @ResponseMessage(AUTH_MESSAGES.SOCIAL_LOGIN_SUCCESS)
  @UseGuards(FacebookAuthGuard)
  @ApiExcludeEndpoint()
  async facebookCallback(@Req() req, @Res() response: Response) {
    const { refreshToken, redirectUrl } = await this.authService.socialLogin(
      req.user,
      ProviderType.FACEBOOK,
    );

    // save refresh token in cookie
    response.cookie('ZTC_token', refreshToken, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRE')),
    });

    return response.redirect(redirectUrl);
  }

  @Public()
  @Post('register')
  @ResponseMessage(AUTH_MESSAGES.REGISTRATION_SUCCESS)
  @ApiOperation({
    summary: 'Đăng ký người dùng',
  })
  handleRegister(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Public()
  @Get('/refresh')
  @ResponseMessage(AUTH_MESSAGES.REFRESH_TOKEN_SUCCESS)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Làm mới access token bằng refresh token',
  })
  async handleRefreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['ZTC_token'];
    const {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    } = await this.authService.processNewToken(refreshToken);

    response.cookie('ZTC_token', newRefreshToken, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRE')),
    });

    return { access_token: accessToken, user };
  }

  @Post('/logout')
  @ResponseMessage(AUTH_MESSAGES.LOGOUT_SUCCESS)
  @ApiOperation({
    summary: 'Dăng xuất người dùng',
  })
  @ApiBearerAuth('access-token')
  async handleLogout(
    @Res({ passthrough: true }) response: Response,
    @User() user: IUser,
  ) {
    await this.authService.logout(user);
    response.clearCookie('ZTC_token');
    return 'ok';
  }

  @Public()
  @Post('forgot-password')
  @ResponseMessage(AUTH_MESSAGES.FORGOT_PASSWORD)
  @ApiOperation({
    summary: 'Quên mật khẩu',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @ResponseMessage(AUTH_MESSAGES.RESET_PASSWORD_SUCCESS)
  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
