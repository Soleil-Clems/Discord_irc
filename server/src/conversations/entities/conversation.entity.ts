import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Users } from '@/users/entities/users.entity';
import { PrivateMessage } from './private-message.entity';

@Entity()
@Unique('UQ_CONVERSATION_USERS', ['user1', 'user2'])
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  user1: Users;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  user2: Users;

  @OneToMany(() => PrivateMessage, (message) => message.conversation)
  messages: PrivateMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  ensureUserOrder() {
    if (this.user1 && this.user2 && this.user1.id > this.user2.id) {
      const temp = this.user1;
      this.user1 = this.user2;
      this.user2 = temp;
    }
  }
}
