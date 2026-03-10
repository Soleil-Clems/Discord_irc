// dms.service.ts
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

  constructor(private readonly configService: ConfigService) {
    const s3_region = this.configService.get<string>('S3_REGION');

    if (!s3_region) {
      this.logger.warn('S3_REGION not found in environment variables');
      throw new Error('S3_REGION not found in environment variables');
    }

    const bucketName = this.configService.get<string>('S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME not found in environment variables');
    }
    this.bucketName = bucketName;

    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    if (!endpoint) {
      throw new Error(
        'S3_ENDPOINT not found in environment variables (required for R2)',
      );
    }
    this.endpoint = endpoint.replace(/\/+$/, '');

    const accessKey = this.configService.get<string>('S3_ACCESS_KEY');
    const secretKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

    this.client = new S3Client({
      region: s3_region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: accessKey || '',
        secretAccessKey: secretKey || '',
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
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
      const fileExtension = file.originalname.split('.').pop();
      const key = `${category}/${uuidv4()}.${fileExtension}`;

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

      await this.client.send(command);

      const signedUrl = await this.getPresignedSignedUrl(key);

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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload ${category} file: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to upload ${category} file: ${errorMessage}`,
      );
    }
  }

  getFileUrl(key: string) {
    const publicDomain = this.configService.get<string>('R2_PUBLIC_DOMAIN');
    if (publicDomain) {
      return { url: `${publicDomain}/${key}` };
    }
    return { url: `${this.endpoint}/${this.bucketName}/${key}` };
  }

  async getPresignedSignedUrl(key: string, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return { url };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate signed URL: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to generate signed URL: ${errorMessage}`,
      );
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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete file: ${errorMessage}`);
      throw new InternalServerErrorException(
        `Failed to delete file: ${errorMessage}`,
      );
    }
  }
}
