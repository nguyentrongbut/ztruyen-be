import { PartialType } from '@nestjs/swagger';
import { CreateEmojiCategoryDto } from './create-emoji-category.dto';

export class UpdateEmojiCategoryDto extends PartialType(CreateEmojiCategoryDto) {}
