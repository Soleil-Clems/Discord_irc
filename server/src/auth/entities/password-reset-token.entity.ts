import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Users } from '@/users/entities/users.entity';

@Entity('password_reset_tokens')
@Index(['userId', 'isUsed'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'token_hash', length: 64 })
  tokenHash: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'is_used', default: false })
  isUsed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
