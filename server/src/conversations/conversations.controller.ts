import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

import { ConversationsService } from './conversations.service';
import { ConversationsGateway } from './conversations.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreatePrivateMessageDto } from './dto/create-private-message.dto';
import { UpdatePrivateMessageDto } from './dto/update-private-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly conversationsGateway: ConversationsGateway,
  ) {}

  @Post()
  createOrGet(@Request() req, @Body() dto: CreateConversationDto) {
    return this.conversationsService.createOrGet(dto, req.user.id);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.findAll(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.conversationsService.findOne(id, req.user.id);
  }

  @Get(':id/messages')
  findMessages(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.findMessages(
      id,
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post(':id/messages')
  createMessage(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePrivateMessageDto,
  ) {
    return this.conversationsService.createMessage(id, dto, req.user.id);
  }

  @Patch('messages/:id')
  async updateMessage(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrivateMessageDto,
  ) {
    const updatedMessage = await this.conversationsService.updateMessage(
      id,
      dto,
      req.user.id,
    );
    const user1Id = updatedMessage.conversation.user1.id;
    const user2Id = updatedMessage.conversation.user2.id;
    this.conversationsGateway.server
      .to(`user:${user1Id}`)
      .to(`user:${user2Id}`)
      .emit('privateMessageUpdated', updatedMessage);
    return updatedMessage;
  }

  @Delete('messages/:id')
  async removeMessage(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const result = await this.conversationsService.removeMessage(
      id,
      req.user.id,
    );
    this.conversationsGateway.server
      .to(`user:${result.user1Id}`)
      .to(`user:${result.user2Id}`)
      .emit('privateMessageDeleted', result.messageId);
    return result;
  }
}
