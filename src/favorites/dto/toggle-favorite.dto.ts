// ** Class Validator
import { IsNotEmpty, IsString } from 'class-validator';

// ** Swagger
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFavoriteDto {

  @ApiProperty({
    example: 'one-piece',
  })
  @IsString()
  @IsNotEmpty()
  comic_slug: string;

  @ApiProperty({
    example: 'One Piece',
  })
  @IsString()
  @IsNotEmpty()
  comic_name: string;

  @ApiProperty({
    example: 'https://cdn.example.com/one-piece.jpg',
  })
  @IsString()
  @IsNotEmpty()
  comic_cover: string;
}