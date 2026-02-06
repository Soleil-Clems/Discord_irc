import { PartialType } from '@nestjs/mapped-types';
import { CreatePrivateMessageDto } from './create-private-message.dto';
import { IsString } from 'class-validator';

export class UpdatePrivateMessageDto extends PartialType(CreatePrivateMessageDto) {
  @IsString()
  content: string;
}
