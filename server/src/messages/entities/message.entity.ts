import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '@/users/entities/users.entity';
import { Channel } from '@/channels/entities/channel.entity';
import { MessageType } from '../enums/message-type.enum';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.Text,
  })
  type: MessageType;

  @ManyToOne(() => Users, (user) => user.messages, {
    onDelete: 'CASCADE',
  })
  author: Users;

  @ManyToOne(() => Channel, (channel) => channel.messages, {
    onDelete: 'CASCADE',
  })
  channel: Channel;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
