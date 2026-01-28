import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '@/users/entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDto | null> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pass, ...result } = user;
    return result;
  }

  async login(user: UserDto) {
    const payload = user;

    const userEntity = await this.userRepository.findOneBy({ id: user.id });

    if (!userEntity) {
      throw new Error('User not found');
    }

    userEntity.lastSeen = new Date();

    await this.userRepository.save(userEntity);

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }
}
