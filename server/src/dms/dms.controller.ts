import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DmsService, FileCategory } from './dms.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VOICE_SIZE = 25 * 1024 * 1024;

const CATEGORY_CONFIG: Record<
  string,
  { category: FileCategory; maxSize: number; allowedTypes: RegExp }
> = {
  img: {
    category: FileCategory.Image,
    maxSize: MAX_FILE_SIZE,
    allowedTypes: /\.(png|jpe?g|gif|webp|avif)$/i,
  },
  voice: {
    category: FileCategory.Voice,
    maxSize: MAX_VOICE_SIZE,
    allowedTypes: /\.(mp3|wav|ogg|m4a|aac|webm)$/i,
  },
  file: {
    category: FileCategory.File,
    maxSize: MAX_FILE_SIZE,
    allowedTypes: /\.(pdf|docx?|txt|xlsx?|csv)$/i,
  },
  pdf: {
    category: FileCategory.File,
    maxSize: MAX_FILE_SIZE,
    allowedTypes: /\.(pdf)$/i,
  },
};

@Controller('dms')
export class DmsController {
  constructor(private readonly dmsService: DmsService) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_VOICE_SIZE,
            message: 'File is too large. Max file size is 25MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('category') category?: string,
  ) {
    const config = CATEGORY_CONFIG[category || ''] || CATEGORY_CONFIG.file;

    if (!config.allowedTypes.test(file.originalname)) {
      throw new BadRequestException(
        `File type not allowed for category "${category || 'file'}"`,
      );
    }

    if (file.size > config.maxSize) {
      throw new BadRequestException(
        `File is too large. Max size for ${category || 'file'} is ${config.maxSize / (1024 * 1024)}MB`,
      );
    }

    return this.dmsService.uploadSingleFile({
      file,
      category: config.category,
    });
  }

  @Get(':key')
  getFileUrl(@Param('key') key: string) {
    return this.dmsService.getFileUrl(key);
  }

  @Get('/signed-url/:key')
  getSignedUrl(@Param('key') key: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.dmsService.getSignedUrl(key);
  }
}
