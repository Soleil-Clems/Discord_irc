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
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(dto, req.user.id);
  }

  @Get('channel/:id')
  findAll(@Param('id', ParseIntPipe) channelId: number) {
    return this.messagesService.findAll(channelId);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.messagesService.remove(id, req.user.id);
  }
}
