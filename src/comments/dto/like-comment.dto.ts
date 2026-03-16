// ** Class Validator
import { IsNotEmpty, IsMongoId } from 'class-validator'

// ** Swagger
import { ApiProperty } from '@nestjs/swagger'

export class LikeCommentDto {

  @ApiProperty({
    example: '664c8c1f7d123abc12345678'
  })
  @IsNotEmpty()
  @IsMongoId()
  commentId: string
}