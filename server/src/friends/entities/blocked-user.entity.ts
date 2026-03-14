import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Users } from '@/users/entities/users.entity';

@Entity()
@Unique('UQ_BLOCKED_USER', ['blocker', 'blocked'])
export class BlockedUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  blocker: Users;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  blocked: Users;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
