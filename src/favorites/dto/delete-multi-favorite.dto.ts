// ** Class validator
import { IsArray, ArrayNotEmpty, IsMongoId } from 'class-validator'

// ** Swagger
import { ApiProperty } from '@nestjs/swagger'

export class DeleteMultiFavoriteDto {

  @ApiProperty({
    example: [
      '65f1a2b3c4d5e6f7a8b9c0d1',
      '65f1a2b3c4d5e6f7a8b9c0d2'
    ]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[]
}