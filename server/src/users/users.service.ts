import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Users } from './entities/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

const saltOrRounds = parseInt(process.env.SALT || '10', 10);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Users> {
    try {
      const hash = await bcrypt.hash(createUserDto.password, saltOrRounds);
      createUserDto.password = hash;
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
      const user = await this.userRepository.findOne({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          updatedAt: true,
          description: true,
          lastname: true,
          firstname: true,
          lastSeen: true,
          isActive: true,
          img: true,
          role: true,
          isTwoFactorEnabled: true,
        },
      });
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
  async findOneByEmail(email: string): Promise<Users> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

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

  async search(query: string): Promise<Users[]> {
    try {
      const sanitized = query.replace(/[%_]/g, '\\$&');
      return await this.userRepository.find({
        where: { username: ILike(`%${sanitized}%`) },
        select: {
          id: true,
          username: true,
          firstname: true,
          lastname: true,
          img: true,
          isActive: true,
          lastSeen: true,
        },
        take: 20,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la recherche',
      );
    }
  }

  async remove(id: number): Promise<{ message: string; error: boolean }> {
    try {
      const user = await this.findOne(id);
      await this.userRepository.remove(user);
      return { message: 'Utilisateur supprimé avec succès', error: false };
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
