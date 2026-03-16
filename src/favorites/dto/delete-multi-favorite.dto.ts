import { IsArray, ArrayNotEmpty, IsMongoId } from 'class-validator';

export class DeleteMultiFavoriteDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}