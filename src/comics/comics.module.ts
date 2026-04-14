// ** Nestjs
import { Module } from '@nestjs/common';

// ** Mongoose
import { MongooseModule } from '@nestjs/mongoose';

// ** Service
import { ComicsService } from './comics.service';

// ** Controller
import { ComicsController } from './comics.controller';

// ** Schema
import { Comic, ComicSchema } from './schemas/comic.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comic.name, schema: ComicSchema }]),
  ],
  controllers: [ComicsController],
  providers: [ComicsService],
})
export class ComicsModule {}
