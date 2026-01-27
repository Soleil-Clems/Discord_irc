import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  firstname: string;

  @Column({ length: 500 })
  lastname: string;

  @Column({ length: 500 })
  username: string;

  @Column({ length: 500 })
  email: string;

  @Column({ length: 500 })
  password: string;

  @Column({ type: 'datetime', name: 'last_seen' })
  lastSeen: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;
}
