import { Users } from 'src/users/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Server } from './server.entity';
import { ServerRole } from '../enums/server-role.enum';

@Entity()
export class ServerMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (user) => user.serverMemberships)
  members: Users;

  @ManyToOne(() => Server, (server) => server.memberships)
  server: Server;

  @Column({
    type: 'enum',
    enum: ServerRole,
    default: ServerRole.Member,
  })
  role: ServerRole;

  @CreateDateColumn()
  joinedAt: Date;
}
