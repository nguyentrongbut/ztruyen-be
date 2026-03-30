// ** Nestjs
import { Module } from '@nestjs/common';

// ** Service
import { EmojisService } from './emojis.service';

// ** Controller
import { EmojisController } from './emojis.controller';

// ** Mongoose
import { MongooseModule } from '@nestjs/mongoose';

// ** Schema
import { Emoji, EmojiSchema } from './schemas/emoji.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Emoji.name, schema: EmojiSchema },
    ]),
  ],
  controllers: [EmojisController],
  providers: [EmojisService]
})
export class EmojisModule {}
