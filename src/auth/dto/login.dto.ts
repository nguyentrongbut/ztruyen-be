// ** Class validator
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'thocon@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}