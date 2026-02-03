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
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreatePrivateMessageDto } from './dto/create-private-message.dto';
import { UpdatePrivateMessageDto } from './dto/update-private-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  createOrGet(@Request() req, @Body() dto: CreateConversationDto) {
    return this.conversationsService.createOrGet(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.conversationsService.findAll(req.user.id);
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
  updateMessage(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrivateMessageDto,
  ) {
    return this.conversationsService.updateMessage(id, dto, req.user.id);
  }

  @Delete('messages/:id')
  removeMessage(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.conversationsService.removeMessage(id, req.user.id);
  }
}
