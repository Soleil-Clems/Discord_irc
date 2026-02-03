import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '@/users/entities/users.entity';
import { Conversation } from './conversation.entity';
import { MessageType } from '@/messages/enums/message-type.enum';

@Entity()
export class PrivateMessage {
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

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  sender: Users;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
