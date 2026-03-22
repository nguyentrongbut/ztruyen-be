import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class BulkDeleteDto {
  @ApiProperty({ type: [String] })
  @IsMongoId({ each: true })
  ids: string[]
}