// ** Class validator
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    example: 'thỏ con xinh xắn',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'thocon@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    example: 18,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  age: number;

  @IsOptional()
  gender?: string;
}