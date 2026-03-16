// ** Class Validator
import { IsNotEmpty, IsMongoId, IsString } from 'class-validator'

// ** Swagger
import { ApiProperty } from '@nestjs/swagger'

export class ReportCommentDto {

  @ApiProperty({
    example: '664c8c1f7d123abc12345678'
  })
  @IsNotEmpty()
  @IsMongoId()
  commentId: string


  @ApiProperty({
    example: 'Spam / Nội dung không phù hợp'
  })
  @IsNotEmpty()
  @IsString()
  reason: string
}