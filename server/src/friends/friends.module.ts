import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { FriendRequest } from './entities/friend-request.entity';
import { BlockedUser } from './entities/blocked-user.entity';
import { Users } from '@/users/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FriendRequest, BlockedUser, Users])],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
