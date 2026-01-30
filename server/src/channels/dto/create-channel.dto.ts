import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ChannelType } from '../enums/channel-type.enum';

export class CreateChannelDto {
  @IsString()
  name: string;

  @IsNumber()
  serverId: number;

  @IsEnum(ChannelType)
  type: ChannelType;
}
