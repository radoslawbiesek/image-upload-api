import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ImagesModule } from './images/images.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    }),
    DatabaseModule,
    StorageModule,
    ImagesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
