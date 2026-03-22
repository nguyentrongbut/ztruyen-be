import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty()
  @IsNotEmpty()
  comicSlug: string;

  @ApiProperty()
  @IsNotEmpty()
  comicName: string;

  @IsOptional()
  chapterId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  page?: number;

  @ApiProperty()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  parent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  replyTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  chapterName?: string;
}
