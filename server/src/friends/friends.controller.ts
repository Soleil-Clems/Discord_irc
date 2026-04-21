import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // Envoyer une demande d'ami
  @Post('request/:userId')
  sendRequest(
    @Request() req,
    @Param(
      'userId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    userId: number,
  ) {
    return this.friendsService.sendRequest(req.user.id, userId);
  }

  // Accepter une demande
  @Patch('request/:id/accept')
  acceptRequest(
    @Request() req,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.friendsService.acceptRequest(id, req.user.id);
  }

  // Refuser une demande
  @Patch('request/:id/decline')
  declineRequest(
    @Request() req,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.friendsService.declineRequest(id, req.user.id);
  }

  // Liste de mes amis
  @Get()
  getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  // Demandes reçues en attente
  @Get('requests/pending')
  getPendingRequests(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.id);
  }

  // Demandes envoyées en attente
  @Get('requests/sent')
  getSentRequests(@Request() req) {
    return this.friendsService.getSentRequests(req.user.id);
  }

  // Supprimer un ami
  @Delete(':userId')
  removeFriend(
    @Request() req,
    @Param(
      'userId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    userId: number,
  ) {
    return this.friendsService.removeFriend(req.user.id, userId);
  }

  // Bloquer un utilisateur
  @Post('block/:userId')
  blockUser(
    @Request() req,
    @Param(
      'userId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    userId: number,
  ) {
    return this.friendsService.blockUser(req.user.id, userId);
  }

  // Débloquer un utilisateur
  @Delete('block/:userId')
  unblockUser(
    @Request() req,
    @Param(
      'userId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    userId: number,
  ) {
    return this.friendsService.unblockUser(req.user.id, userId);
  }

  // Liste des bloqués
  @Get('blocked')
  getBlockedUsers(@Request() req) {
    return this.friendsService.getBlockedUsers(req.user.id);
  }
}
