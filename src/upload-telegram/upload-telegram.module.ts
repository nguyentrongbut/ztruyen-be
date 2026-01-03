// ** NestJs
import { Module, forwardRef } from '@nestjs/common';

// ** Services
import { UploadTelegramService } from './upload-telegram.service';

// ** Controllers
import { UploadTelegramController } from './upload-telegram.controller';

// ** Module
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [forwardRef(() => ImagesModule)],
  controllers: [UploadTelegramController],
  providers: [UploadTelegramService],
  exports: [UploadTelegramService],
})
export class UploadTelegramModule {}
