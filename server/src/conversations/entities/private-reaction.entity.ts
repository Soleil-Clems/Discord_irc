import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Users } from '@/users/entities/users.entity';
import { PrivateMessage } from './private-message.entity';

@Entity()
export class PrivateReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  emoji: string;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  author: Users;

  @ManyToOne(() => PrivateMessage, (message) => message.reactions, {
    onDelete: 'CASCADE',
  })
  message: PrivateMessage;
}
