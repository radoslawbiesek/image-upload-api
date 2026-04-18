import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly client: S3Client;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('AWS_ENDPOINT');
    this.client = new S3Client({
      region: config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
      ...(endpoint && { endpoint, forcePathStyle: true }),
    });
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getObject(bucket: string, key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const chunks = await response.Body!.transformToByteArray();

    return Buffer.from(chunks);
  }
}
