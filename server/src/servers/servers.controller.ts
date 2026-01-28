import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/users/guards/roles.guard';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CreateServerDto } from './dto/create-server.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('servers')
export class ServersController {
  @Post('create')
  create(@Request() req, @Body() createServerDto: CreateServerDto) {
    console.log(req.user);
    return createServerDto;
  }
}
