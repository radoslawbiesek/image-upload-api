import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getQueueToken } from '@nestjs/bullmq';

import { AppModule } from './../src/app.module';
import { IMAGES_QUEUE } from '../src/images/processors/constants';
import { ImageProcessor } from '../src/images/processors/image.processor';

const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken(IMAGES_QUEUE))
      .useValue(mockQueue)
      .overrideProvider(ImageProcessor)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect('ok');
  });
});
