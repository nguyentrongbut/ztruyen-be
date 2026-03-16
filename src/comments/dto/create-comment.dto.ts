// ** Class Validator
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

// ** Swagger
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    example: 'one-piece',
  })
  @IsString()
  @IsNotEmpty()
  comic_slug: string;

  @ApiPropertyOptional({
    example: '664c8c1f7d123abc1234567d',
  })
  @IsOptional()
  @IsString()
  chapter_id?: string;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({
    example: 'Truyện hay quá 🔥',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: '664c8c1f7d123abc12345678',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
