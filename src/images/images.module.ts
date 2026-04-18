import { Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { IMAGES_QUEUE } from './processors/constants';
import { ImageProcessor } from './processors/image.processor';
import { ImagesController } from './images.controller';
import { ImagesRepository } from './images.repository';
import { ImagesService } from './images.service';

@Module({
  imports: [BullModule.registerQueue({ name: IMAGES_QUEUE })],
  controllers: [ImagesController],
  providers: [ImagesService, ImagesRepository, ImageProcessor, Logger],
})
export class ImagesModule {}
