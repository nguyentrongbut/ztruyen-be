// ** Validation
import { IsNotEmpty, IsString } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class FcmTokenDto {
  @ApiProperty({
    example: 'cxyz1234abcd:APA91bHPRgkFLr9r8...',
    description: 'FCM token lấy từ Firebase SDK phía client',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token không được để trống' })
  token: string;
}