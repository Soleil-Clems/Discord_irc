import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServerDto } from './dto/create-server.dto';
// import { UpdateServerDto } from './dto/update-server.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '@/users/entities/users.entity';
import { Repository } from 'typeorm';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
import { ServerRole } from './enums/server-role.enum';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private serverMemberRepository: Repository<ServerMember>,
  ) {}
  async create(createServerDto: CreateServerDto, userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    const server = this.serverRepository.create({ name: createServerDto.name });
    await this.serverRepository.save(server);

    const membershipsData = {
      members: user,
      role: ServerRole.Owner,
      server: server,
    };

    const memberships = this.serverMemberRepository.create(membershipsData);
    await this.serverMemberRepository.save(memberships);

    return server;
  }

  async findAll() {
    return await this.serverRepository.find();
  }

  async findOne(id: number) {
    const server = await this.serverRepository.findOne({
      where: { id },
      relations: {
        memberships: true,
      },
    });

    if (!server) {
      throw new NotFoundException('Serveur non trouvé');
    }

    return server;
  }

  // update(id: number, updateServerDto: UpdateServerDto) {
  //   return `This action updates a #${id} server`;
  // }

  remove(id: number) {
    return `This action removes a #${id} server`;
  }
}
