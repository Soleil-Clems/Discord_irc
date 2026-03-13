import { IsNumber } from 'class-validator';

export class CreateFriendRequestDto {
  @IsNumber()
  receiverId: number;
}
