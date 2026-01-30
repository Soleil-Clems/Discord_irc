import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServerMember } from './server-member.entity';
import { Channel } from '@/channels/entities/channel.entity';

@Entity()
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @OneToMany(() => ServerMember, (sm) => sm.server)
  memberships: ServerMember[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Channel, (channel) => channel.server)
  channels: Channel[];
}
