// ** Class Validator
import { IsNotEmpty } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'thocon123' })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'bunnycute123' })
  @IsNotEmpty()
  newPassword: string;
}

export class AdminChangePasswordDto {
  @ApiProperty({ example: 'thocon123' })
  @IsNotEmpty()
  newPassword: string;
}
