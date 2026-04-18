import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MultipartGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers['content-type']?.includes('multipart/form-data')) {
      throw new UnsupportedMediaTypeException('multipart/form-data required');
    }

    return true;
  }
}
