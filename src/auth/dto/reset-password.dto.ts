// ** Class validator
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example:
      '4195d708702056aa80be11dd5ebf02ed9ca35522e7d498d2f8c8dcc07a68481a',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'thocon123',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
