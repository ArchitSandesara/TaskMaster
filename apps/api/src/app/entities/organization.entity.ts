import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { Task } from './task.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @ManyToOne(() => Organization, (org) => org.children, { nullable: true })
  parent?: Organization | null;

  @OneToMany(() => Organization, (org) => org.parent)
  children?: Organization[];

  @OneToMany(() => User, (user) => user.organization)
  users?: User[];

  @OneToMany(() => Role, (role) => role.organization)
  roles?: Role[];

  @OneToMany(() => Task, (task) => task.organization)
  tasks?: Task[];

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
