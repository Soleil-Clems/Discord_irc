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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const s3_region = this.configService.get<string>('S3_REGION');

    if (!s3_region) {
      this.logger.warn('S3_REGION not found in environment variables');
      throw new Error('S3_REGION not found in environment variables');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const bucketName = this.configService.get<string>('S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME not found in environment variables');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.bucketName = bucketName;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    if (!endpoint) {
      throw new Error(
        'S3_ENDPOINT not found in environment variables (required for R2)',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.endpoint = endpoint;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const secretKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

    console.log('=== R2 Configuration ===');
    console.log('Region:', s3_region);
    console.log('Bucket:', bucketName);
    console.log('Endpoint:', endpoint);
    console.log('Access Key:', accessKey?.substring(0, 8) + '...');
    console.log('Secret Key exists:', !!secretKey);
    console.log('Secret Key length:', secretKey?.length);
    console.log('========================');

    this.client = new S3Client({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      region: s3_region,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      endpoint: endpoint,
      credentials: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        accessKeyId: accessKey || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        secretAccessKey: secretKey || '',
      },
      forcePathStyle: true,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fileExtension = file.originalname.split('.').pop();
      const key = `${category}/${uuidv4()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        Body: file.buffer,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ContentType: file.mimetype,
        Metadata: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          originalName: file.originalname,
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        originalName: file.originalname,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        size: file.size,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const publicDomain = this.configService.get<string>('R2_PUBLIC_DOMAIN');
    if (publicDomain) {
      return { url: `${publicDomain}/${key}` };
    }
    // Sinon utiliser l'endpoint R2
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
