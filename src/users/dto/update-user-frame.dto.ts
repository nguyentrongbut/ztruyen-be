// ** Nestjs
import { ApiProperty } from '@nestjs/swagger';

// ** Class validator
import { IsMongoId } from 'class-validator';

export class UpdateProfileFrameDto {
  @ApiProperty({
    example: '695b4a8139ebc0e4db1061fd'
  })
  @IsMongoId()
  avatar_frame: string;
}
