import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto, UpdateUserDto } from 'data';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>
  ) {}

  async findAll(organizationId?: number): Promise<User[]> {
    const whereClause = organizationId 
      ? { organization: { id: organizationId }, isActive: true }
      : { isActive: true };

    return this.userRepo.find({
      where: whereClause,
      relations: ['organization', 'role'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ 
      where: { id },
      relations: ['organization', 'role']
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingEmail = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existingEmail) {
      throw new ForbiddenException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.userRepo.findOne({ where: { username: dto.username.toLowerCase() } });
    if (existingUsername) {
      throw new ForbiddenException('Username already exists');
    }

    // Find organization
    const organization = await this.orgRepo.findOne({ where: { id: dto.organizationId } });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Find role
    const role = await this.roleRepo.findOne({ 
      where: { 
        id: dto.roleId,
        organization: { id: dto.organizationId }
      }
    });
    if (!role) {
      throw new NotFoundException('Role not found in this organization');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      organization,
      role,
      isActive: true
    });

    return this.userRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check email uniqueness if changing
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingEmail = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
      if (existingEmail && existingEmail.id !== id) {
        throw new ForbiddenException('Email already exists');
      }
      user.email = dto.email.toLowerCase();
    }

    // Check username uniqueness if changing
    if (dto.username && dto.username.toLowerCase() !== user.username) {
      const existingUsername = await this.userRepo.findOne({ where: { username: dto.username.toLowerCase() } });
      if (existingUsername && existingUsername.id !== id) {
        throw new ForbiddenException('Username already exists');
      }
      user.username = dto.username.toLowerCase();
    }

    // Update other fields
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;

    // Update role if provided
    if (dto.roleId) {
      const role = await this.roleRepo.findOne({ 
        where: { 
          id: dto.roleId,
          organization: { id: user.organization.id }
        }
      });
      if (!role) {
        throw new NotFoundException('Role not found in this organization');
      }
      user.role = role;
    }

    return this.userRepo.save(user);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const user = await this.findOne(id);
    
    // Soft delete by setting isActive to false
    user.isActive = false;
    await this.userRepo.save(user);
    
    return { success: true };
  }

  async getRolesForOrganization(organizationId: number) {
    return this.roleRepo.find({
      where: { organization: { id: organizationId } },
      order: { name: 'ASC' }
    });
  }
}