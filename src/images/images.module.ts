import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesRepository } from './images.repository';
import { ImagesService } from './images.service';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService, ImagesRepository],
  exports: [ImagesService],
})
export class ImagesModule {}
