import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';

export async function createApp(
  module: TestingModule,
): Promise<INestApplication<App>> {
  const app = module.createNestApplication();

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

  await app.init();

  return app;
}
