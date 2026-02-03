import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Server } from './server.entity';
import { Users } from '@/users/entities/users.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 16, unique: true })
  code: string;

  @Column({ name: 'server_id' })
  serverId: number;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'server_id' })
  server: Server;

  @Column({ name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: Users;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ name: 'uses_count', default: 0 })
  usesCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
