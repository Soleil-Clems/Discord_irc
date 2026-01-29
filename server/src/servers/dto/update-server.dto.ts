import { PartialType } from '@nestjs/mapped-types';
import { CreateServerDto } from './create-server.dto';
import { IsString } from 'class-validator';

export class UpdateServerDto extends PartialType(CreateServerDto) {
  @IsString()
  name: string;
}
