// ** NestJs
import { Module, forwardRef } from '@nestjs/common';

// ** Services
import { ImagesService } from './images.service';

// ** Controllers
import { ImagesController } from './images.controller';

// ** Mongoose
import { MongooseModule } from '@nestjs/mongoose';

// ** Schemas
import { Image, ImageSchema } from './schemas/image.schema';

// ** Module
import { UploadTelegramModule } from '../upload-telegram/upload-telegram.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Image.name, schema: ImageSchema }]),
    forwardRef(() => UploadTelegramModule),
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
