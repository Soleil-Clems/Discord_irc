import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/users/guards/roles.guard';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CreateServerDto } from './dto/create-server.dto';
import { ServersService } from './servers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post('create')
  async create(@Request() req, @Body() createServerDto: CreateServerDto) {
    return await this.serversService.create(createServerDto, req.user.id);
  }
}
