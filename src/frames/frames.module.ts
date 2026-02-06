// ** NestJs
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ** Services
import { FramesService } from './frames.service';

// ** Controllers
import { FramesController } from './frames.controller';

// ** Schemas
import { Frame, FrameSchema } from './schemas/frame.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Frame.name, schema: FrameSchema }]),
  ],
  controllers: [FramesController],
  providers: [FramesService],
})
export class FramesModule {}
