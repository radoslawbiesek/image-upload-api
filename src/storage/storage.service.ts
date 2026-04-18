import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
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
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.client.send(command);
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await this.client.send(command);
  }

  async getObject(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await this.client.send(command);
    const chunks = await response.Body!.transformToByteArray();

    return Buffer.from(chunks);
  }
}
