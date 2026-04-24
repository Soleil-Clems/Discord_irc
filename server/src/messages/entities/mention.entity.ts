import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Users } from '@/users/entities/users.entity';
import { Message } from './message.entity';

@Entity()
export class Mention {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  user: Users;

  @ManyToOne(() => Message, (message) => message.mentions, {
    onDelete: 'CASCADE',
  })
  message: Message;
}
