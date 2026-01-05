// ** NestJs
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Module
import { AppModule } from './app.module';

// ** Guard & Interceptor
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TransformInterceptor } from './core/transform.interceptor';

// ** Cookies Parser
import cookieParser from 'cookie-parser';

// ** Swagger
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Global guard & Interceptor
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // config cookies
  app.use(cookieParser());

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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập access token',
        in: 'header',
      },
      'access-token',
    )

    // ===== TAG DESCRIPTIONS =====
    .addTag(
      'authentication',
      'Xác thực người dùng',
    )
    .addTag(
      'user',
      'Người dùng',
    )
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
