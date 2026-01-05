// ** NestJS
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// ** Modules
import { UsersModule } from '../users/users.module';
import { ImagesModule } from '../images/images.module';

// ** Services
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';

// ** Controllers
import { AuthController } from './auth.controller';

// ** Passport
import { LocalStrategy } from './passport/strategies/local.strategy';
import { JwtStrategy } from './passport/strategies/jwt.strategy';
import { GoogleStrategy } from './passport/strategies/google.strategy';
import { FacebookStrategy } from './passport/strategies/facebook.strategy';

// ** ms
import ms from 'ms';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ImagesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN'),
        signOptions: {
          expiresIn:
            ms(configService.get<string>('JWT_ACCESS_TOKEN_EXPIRE') as string) / 1000,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    EmailService,
    GoogleStrategy,
    FacebookStrategy,
  ]
})
export class AuthModule {}
