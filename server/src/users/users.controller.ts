import {
  Controller,
  Get,
  Post,
  Body,
  ParseIntPipe,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailParamDto } from './dto/email-param.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Role } from './enums/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { DmsService, FileCategory } from '@/dms/dms.service';
import { MimeTypeValidator } from '@/common/validators/mime-type.validator';
import { UserProfileDto } from './dto/user-profile.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = {
  img: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  voice: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'audio/webm',
  ],
  file: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
} as const;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly dmsService: DmsService,
  ) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.usersService.search(q ?? '');
  }

  @Get('email/:email')
  findByEmail(
    @Param()
    params: EmailParamDto,
  ) {
    const result = this.usersService.findOneByEmail(params.email);
    return result;
  }

  @Roles(Role.Admin)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (Object.keys(updateUserDto).length == 0) {
      return;
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Patch('picture/:id')
  async updatePicture(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MimeTypeValidator({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mimeTypes: ALLOWED_MIME_TYPES.img as any,
          }),
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE,
            message: 'Image is too large. Max file size is 10MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    // Upload du fichier
    const uploadResult = await this.dmsService.uploadSingleFile({
      file,
      category: FileCategory.Image,
    });

    const updateDto: UpdateUserDto = {
      img: uploadResult.url,
    };

    return await this.usersService.update(id, updateDto);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Patch('banner/:id')
  async updateBanner(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MimeTypeValidator({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mimeTypes: ALLOWED_MIME_TYPES.img as any,
          }),
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE,
            message: 'Image is too large. Max file size is 10MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const uploadResult = await this.dmsService.uploadSingleFile({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      file,
      category: FileCategory.Image,
    });

    const updateDto: UpdateUserDto = {
      banner: uploadResult.url,
    };

    return await this.usersService.update(id, updateDto);
  }

  @Get(':id/profile')
  async getPublicProfile(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ): Promise<UserProfileDto> {
    return this.usersService.getPublicProfile(id);
  }
}
