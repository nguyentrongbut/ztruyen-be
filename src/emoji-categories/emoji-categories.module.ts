// ** Nestjs
import { Module } from '@nestjs/common';

// ** Mongoose
import { MongooseModule } from '@nestjs/mongoose';

// ** Service
import { EmojiCategoriesService } from './emoji-categories.service';

// ** Controller
import { EmojiCategoriesController } from './emoji-categories.controller';

// ** Schema
import {
  EmojiCategory,
  EmojiCategorySchema,
} from './schemas/emoji-category.schema';
import { Emoji, EmojiSchema } from '../emojis/schemas/emoji.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmojiCategory.name, schema: EmojiCategorySchema },
      { name: Emoji.name, schema: EmojiSchema },
    ]),
  ],
  controllers: [EmojiCategoriesController],
  providers: [EmojiCategoriesService],
})
export class EmojiCategoriesModule {}
