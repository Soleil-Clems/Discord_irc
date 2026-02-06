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
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServersService } from './servers.service';
import { ServersGateway } from './servers.gateway';
import { ChangeRoleDto } from './dto/change-role.dto';
import { LeaveServerDto } from './dto/leave-server.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { GetMembersQueryDto } from './dto/get-members-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('servers')
export class ServersController {
  constructor(
    private readonly serversService: ServersService,
    private readonly serversGateway: ServersGateway,
  ) {}

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
  async changeRole(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Body() dto: ChangeRoleDto,
  ) {
    const result = await this.serversService.changeMemberRole(
      serverId,
      req.user.id,
      dto.memberId,
      dto.role,
    );
    this.serversGateway.server.emit('memberRoleChanged', {
      serverId,
      memberId: dto.memberId,
      role: dto.role,
    });
    return result;
  }

  @Post(':id/transfer-ownership')
  async transferOwnership(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Body() dto: TransferOwnershipDto,
  ) {
    const result = await this.serversService.transferOwnership(
      serverId,
      req.user.id,
      dto.newOwnerId,
    );
    this.serversGateway.server.emit('memberRoleChanged', {
      serverId,
      memberId: dto.newOwnerId,
      role: 'server_owner',
    });
    return result;
  }

  @Post(':id/join')
  join(@Request() req, @Param('id', ParseIntPipe) serverId: number) {
    return this.serversService.joinServer(serverId, req.user.id);
  }

  @Get(':id/members')
  getMembers(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Query() query: GetMembersQueryDto,
  ) {
    return this.serversService.getMembers(serverId, req.user.id, query);
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
  async banUser(
    @Request() req,
    @Param('id', ParseIntPipe) serverId: number,
    @Body() dto: BanUserDto,
  ) {
    const result = await this.serversService.banUser(
      serverId,
      req.user.id,
      dto.userId,
      dto.reason,
    );
    this.serversGateway.server.emit('memberBanned', {
      serverId,
      userId: dto.userId,
    });
    return result;
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
  getBannedUsers(@Request() req, @Param('id', ParseIntPipe) serverId: number) {
    return this.serversService.getBannedUsers(serverId, req.user.id);
  }
}
