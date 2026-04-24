import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '@/users/entities/users.entity';
import { Channel } from '@/channels/entities/channel.entity';
import { MessageType } from '../enums/message-type.enum';
import { Reaction } from './reaction.entity';
import { Mention } from './mention.entity';

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

  @OneToMany(() => Reaction, (reaction) => reaction.message)
  reactions: Reaction[];

  @OneToMany(() => Mention, (mention) => mention.message)
  mentions: Mention[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
