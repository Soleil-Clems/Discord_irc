import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelType } from '../enums/channel-type.enum';
import { Server } from '@/servers/entities/server.entity';

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

  @CreateDateColumn()
  createdAt: Date;
}
