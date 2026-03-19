import { Users } from 'src/users/entities/users.entity';import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Server } from './server.entity';

@Entity('server_bans')
@Unique('UQ_SERVER_BAN', ['server', 'user'])
export class ServerBan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  server: Server;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  user: Users;

  @ManyToOne(() => Users, { onDelete: 'SET NULL' })
  bannedBy: Users;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn()
  bannedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;
}
