import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { Role } from '../enums/roles.enum';
import { ServerMember } from '../../servers/entities/server-member.entity';
import { Message } from '@/messages/entities/message.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  firstname: string;

  @Column({ length: 500 })
  lastname: string;

  @Column({ length: 500, unique: true })
  username: string;

  @Column({ length: 500, unique: true })
  @Unique('UQ_USER_EMAIL', ['email'])
  email: string;

  @Column({ length: 500 })
  password: string;

  @Column({ length: 500, nullable: true })
  img: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'datetime', name: 'last_seen', nullable: true })
  lastSeen: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  role: Role;

  @Column({ name: 'is_two_factor_enabled', default: false })
  isTwoFactorEnabled: boolean;

  @OneToMany(() => ServerMember, (sm) => sm.members)
  serverMemberships: ServerMember[];

  @OneToMany(() => Message, (message) => message.author)
  messages: Message[];
}
