import { FileValidator } from '@nestjs/common';

export type MimeType =
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'audio/mpeg'
  | 'audio/mp3'
  | 'audio/wav'
  | 'audio/ogg'
  | 'audio/m4a'
  | 'audio/webm'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export class MimeTypeValidator extends FileValidator {
  private allowedMimeTypes: MimeType[];

  constructor(options: { mimeTypes: MimeType[] }) {
    super(options);
    this.allowedMimeTypes = options.mimeTypes;
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;
    return this.allowedMimeTypes.includes(file.mimetype as MimeType);
  }

  buildErrorMessage(): string {
    return `File type must be one of: ${this.allowedMimeTypes.join(', ')}`;
  }
}
