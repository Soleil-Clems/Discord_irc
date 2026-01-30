import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelType } from '../enums/channel-type.enum';
import { Server } from '@/servers/entities/server.entity';
import { Message } from '@/messages/entities/message.entity';

@Entity('channel')
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ChannelType,
    default: ChannelType.Text,
  })
  type: ChannelType;

  @ManyToOne(() => Server, (server) => server.channels, {
    onDelete: 'CASCADE',
  })
  server: Server;

  @OneToMany(() => Message, (message) => message.channel)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;
}
