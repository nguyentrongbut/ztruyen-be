// ** Class validator
import { IsDate, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
    example: '2003-11-28',
    description: 'Ngày sinh (ISO string)',
  })
  @Type(() => Date)
  @IsDate({ message: 'Ngày sinh không hợp lệ' })
  birthday: Date;

  @ApiProperty({
    example: 18,
    minimum: 0,
  })
  @IsInt()
  @Min(10, { message: 'Tuổi phải từ 10 trở lên' })
  @Max(100, { message: 'Tuổi không được lớn hơn 100' })
  age: number;

  @IsOptional()
  gender?: string;

  @ApiProperty({
    description: 'Cloudflare Turnstile token',
    example: '0x4AAAAA...',
  })
  @IsNotEmpty()
  @IsString()
  cfToken: string;
}