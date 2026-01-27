import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Users> {
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }

      throw new InternalServerErrorException(
        "Une erreur est survenue lors de la création de l'utilisateur",
      );
    }
  }

  async findAll(): Promise<Users[]> {
    try {
      return await this.userRepository.find();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la récupération des utilisateurs',
      );
    }
  }

  async findOne(id: number): Promise<Users> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Une erreur est survenue lors de la récupération de l'utilisateur",
      );
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Users> {
    try {
      const user = await this.findOne(id);

      Object.assign(user, updateUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'Un utilisateur avec cet email existe déjà',
        );
      }

      throw new InternalServerErrorException(
        "Une erreur est survenue lors de la mise à jour de l'utilisateur",
      );
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const user = await this.findOne(id);
      await this.userRepository.remove(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Une erreur est survenue lors de la suppression de l'utilisateur",
      );
    }
  }
}
