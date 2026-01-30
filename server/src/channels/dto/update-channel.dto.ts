import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelDto } from './create-channel.dto';
import { IsString } from 'class-validator';

export class UpdateChannelDto extends PartialType(CreateChannelDto) {
  @IsString()
  name: string;
}
