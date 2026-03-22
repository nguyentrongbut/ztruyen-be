import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReplyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  parent: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  replyTo?: string;

  @ApiProperty()
  @IsNotEmpty()
  content: string;
}