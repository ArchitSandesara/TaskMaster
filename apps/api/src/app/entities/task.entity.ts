import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 'To Do' })
  status!: string;

  @Column({ default: 'Work' })
  category!: string;

  @Column({ default: 'Medium' })
  priority!: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  assignedTo?: User | null;

  @ManyToOne(() => User, { eager: true })
  assignedBy!: User;

  @ManyToOne(() => Organization, (org) => org.tasks, { eager: true })
  organization!: Organization;

  @Column({ type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
