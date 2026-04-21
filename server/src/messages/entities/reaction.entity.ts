import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

import { Users } from '@/users/entities/users.entity';
import { Message } from './message.entity';

@Entity()
export class Reaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  emoji: string;

  @ManyToOne(() => Users, (user) => user.messages, {
    onDelete: 'CASCADE',
  })
  author: Users;

  @ManyToOne(() => Message, (message) => message.reactions, {
    onDelete: 'CASCADE',
  })
  message: Message;
}
