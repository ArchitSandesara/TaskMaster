import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string; // RoleName

  @Column('simple-array', { default: '' })
  permissions!: string[]; // Permission[] as strings

  @ManyToOne(() => Organization, (org) => org.roles, { eager: true })
  organization!: Organization;

  @OneToMany(() => User, (user) => user.role)
  users?: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
