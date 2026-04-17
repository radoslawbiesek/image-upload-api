import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Image Upload API')
    .setDescription('Upload and manage images')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
