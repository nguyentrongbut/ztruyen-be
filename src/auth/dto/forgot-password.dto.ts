// ** Class validator
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'thocon@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Cloudflare Turnstile token',
    example: '0x4AAAAA...',
  })
  @IsNotEmpty()
  @IsString()
  cfToken: string;
}