import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DmsService, FileCategory } from './dms.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VOICE_SIZE = 25 * 1024 * 1024;

const FILE_TYPE_VALIDATORS = {
  img: '.(png|jpeg|jpg|gif|webp)',
  voice: '.(mp3|wav|ogg|m4a|aac)',
  file: '.(pdf|doc|docx|txt|xlsx|xls|csv)',
};

@Controller('dms')
export class DmsController {
  constructor(private readonly dmsService: DmsService) {}

  @Post('/upload/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: FILE_TYPE_VALIDATORS.img }),
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE,
            message: 'Image is too large. Max file size is 10MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Query('isPublic') isPublic?: string,
  ) {
    return this.dmsService.uploadSingleFile({
      file,
      category: FileCategory.Image,
      isPublic: isPublic !== 'false',
    });
  }

  @Post('/upload/voice')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVoice(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: FILE_TYPE_VALIDATORS.voice }),
          new MaxFileSizeValidator({
            maxSize: MAX_VOICE_SIZE,
            message: 'Audio file is too large. Max file size is 25MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Query('isPublic') isPublic?: string,
  ) {
    return this.dmsService.uploadSingleFile({
      file,
      category: FileCategory.Voice,
      isPublic: isPublic !== 'false',
    });
  }

  @Post('/upload/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: FILE_TYPE_VALIDATORS.file }),
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE,
            message: 'File is too large. Max file size is 10MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Query('isPublic') isPublic?: string,
  ) {
    return this.dmsService.uploadSingleFile({
      file,
      category: FileCategory.File,
      isPublic: isPublic !== 'false',
    });
  }

  @Get(':key')
  getFileUrl(@Param('key') key: string) {
    return this.dmsService.getFileUrl(key);
  }

  @Get('/signed-url/:key')
  async getSignedUrl(@Param('key') key: string) {
    return this.dmsService.getPresignedSignedUrl(key);
  }
}
