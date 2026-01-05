// ** Class validator
import { IsEmail, IsNotEmpty } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'thocon@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}