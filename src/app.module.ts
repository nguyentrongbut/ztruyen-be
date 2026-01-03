// ** NestJs
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// ** Controller
import { AppController } from './app.controller';

// ** Service
import { AppService } from './app.service';

// ** Soft Delete Plugin
import { softDeletePlugin } from 'soft-delete-plugin-mongoose';
import { ImagesModule } from './images/images.module';
import { UploadTelegramModule } from './upload-telegram/upload-telegram.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL'),
        connectionFactory: (connection) => {
          connection.plugin(softDeletePlugin);
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ImagesModule,
    UploadTelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
