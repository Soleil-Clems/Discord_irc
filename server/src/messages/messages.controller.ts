import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Post()
  create(@Request() req, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(dto, req.user.id);
  }

  @Get('channel/:id')
  findAll(@Param('id', ParseIntPipe) channelId: number) {
    return this.messagesService.findAll(channelId);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMessageDto,
  ) {
    const updatedMessage = await this.messagesService.update(
      id,
      dto,
      req.user.id,
    );
    if (updatedMessage) {
      const roomName = `channel_${updatedMessage.channel.id}`;
      this.messagesGateway.server
        .to(roomName)
        .emit('messageUpdated', updatedMessage);
    }
    return updatedMessage;
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const result = await this.messagesService.remove(id, req.user.id);
    const roomName = `channel_${result.channelId}`;
    this.messagesGateway.server
      .to(roomName)
      .emit('messageDeleted', result.messageId);
    return result;
  }
}
