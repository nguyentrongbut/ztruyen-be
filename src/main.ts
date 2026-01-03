// ** NestJs
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Module
import { AppModule } from './app.module';

// ** Interceptor
import { TransformInterceptor } from './core/transform.interceptor';

// ** Swagger
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Global Interceptor
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  // Global validation
  app.useGlobalPipes(new ValidationPipe());

  // config cors
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  // config versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1'],
  });

  const descSwagger = `
  [ Base URL: api.ztruyen.io.vn/api/v1 ]

[ztruyen.io.vn](https://ztruyen.io.vn) Website cung cấp truyện tranh miễn phí nhanh chất lượng cao.  
Nguồn truyện tranh chất lượng cao cập nhật nhanh nhất.  
API truyện tranh, Data truyện tranh miễn phí.`

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ztruyen API')
    .setDescription(descSwagger)
    .setVersion('1.0.0')

    // ===== TAG DESCRIPTIONS =====
    .addTag(
      'image',
      'Hình ảnh',
    )
    .addTag(
      'upload',
      'Upload ảnh',
    )

    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'ztruyen API Document',
  });

  // Listen
  const port = configService.get<string>('PORT');
  await app.listen(port || 4000);
}

bootstrap();
