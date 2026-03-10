import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export enum FileCategory {
  Voice = 'voice',
  Image = 'img',
  File = 'file',
}

@Injectable()
export class DmsService {
  private readonly logger = new Logger(DmsService.name);
  private client: S3Client;
  private bucketName: string;
  private endpoint: string;
  private publicDomain: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const s3_region = this.configService.getOrThrow<string>('S3_REGION');
    this.bucketName = this.configService.getOrThrow<string>('S3_BUCKET_NAME');
    const endpoint = this.configService.getOrThrow<string>('S3_ENDPOINT');
    this.endpoint = endpoint.replace(/\/+$/, '');

    const accessKey = this.configService.getOrThrow<string>('S3_ACCESS_KEY');
    const secretKey = this.configService.getOrThrow<string>(
      'S3_SECRET_ACCESS_KEY',
    );

    this.publicDomain = this.configService.get<string>('R2_PUBLIC_DOMAIN');

    this.client = new S3Client({
      region: s3_region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  private handleS3Error(operation: string, error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`${operation}: ${message}`);
    throw new InternalServerErrorException(`${operation}: ${message}`);
  }

  async uploadSingleFile({
    file,
    category,
    isPublic = true,
  }: {
    file: Express.Multer.File;
    category: FileCategory;
    isPublic?: boolean;
  }) {
    try {
      const fileExtension = path.extname(file.originalname) || '.bin';
      const key = `${category}/${uuidv4()}${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: encodeURIComponent(file.originalname),
          category: category,
          uploadDate: new Date().toISOString(),
        },
      });

      const [, signedUrl] = await Promise.all([
        this.client.send(command),
        this.getSignedUrl(key),
      ]);

      return {
        url: signedUrl.url,
        key,
        category,
        isPublic,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.handleS3Error(`Failed to upload ${category} file`, error);
    }
  }

  getFileUrl(key: string) {
    if (this.publicDomain) {
      return { url: `${this.publicDomain}/${key}` };
    }
    return { url: `${this.endpoint}/${this.bucketName}/${key}` };
  }

  async getSignedUrl(key: string, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return { url };
    } catch (error) {
      this.handleS3Error('Failed to generate signed URL', error);
    }
  }

  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return { success: true, key };
    } catch (error) {
      this.handleS3Error('Failed to delete file', error);
    }
  }
}
