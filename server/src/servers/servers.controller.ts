import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServersService } from './servers.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { LeaveServerDto } from './dto/leave-server.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { BanUserDto } from './dto/ban-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  async create(@Request() req, @Body() createServerDto: CreateServerDto) {
    return this.serversService.create(createServerDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req) {
    return this.serversService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Request() req,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.serversService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateServerDto: UpdateServerDto,
  ) {
    return this.serversService.update(id, updateServerDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.serversService.remove(id, req.user.id);
  }

  @Patch(':id/members/role')
  changeRole(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.serversService.changeMemberRole(
      serverId,
      req.user.id,
      dto.memberId,
      dto.role,
    );
  }

  @Post(':id/join')
  join(@Request() req, @Param('id', ParseIntPipe) serverId: number) {
    return this.serversService.joinServer(serverId, req.user.id);
  }

  @Post(':id/leave')
  leave(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Body() dto: LeaveServerDto,
  ) {
    return this.serversService.leaveServer(
      serverId,
      req.user.id,
      dto.newOwnerId,
    );
  }

  @Post(':id/invitations')
  createInvitation(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.serversService.createInvitation(serverId, req.user.id, dto);
  }

  @Get(':id/invitations')
  getInvitations(@Request() req, @Param('id', ParseIntPipe) serverId: number) {
    return this.serversService.getServerInvitations(serverId, req.user.id);
  }

  @Delete(':id/invitations/:invitationId')
  deleteInvitation(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    return this.serversService.deleteInvitation(
      serverId,
      invitationId,
      req.user.id,
    );
  }

  @Post('join/:code')
  joinByCode(@Request() req, @Param('code') code: string) {
    return this.serversService.joinByCode(code, req.user.id);
  }

  @Post(':id/bans')
  banUser(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Body() dto: BanUserDto,
  ) {
    return this.serversService.banUser(
      serverId,
      req.user.id,
      dto.userId,
      dto.reason,
    );
  }

  @Delete(':id/bans/:userId')
  unbanUser(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.serversService.unbanUser(serverId, req.user.id, userId);
  }

  @Get(':id/bans')
  getBannedUsers(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
  ) {
    return this.serversService.getBannedUsers(serverId, req.user.id);
  }
}
