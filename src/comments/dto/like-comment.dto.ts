// ** Class validator
import { IsNotEmpty, IsString } from 'class-validator'

// ** Swagger
import { ApiProperty } from '@nestjs/swagger'

export class LikeCommentDto {

  @ApiProperty({
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsString()
  @IsNotEmpty()
  commentId: string
}