import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from 'data';
import { User } from './entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly repo: Repository<Task>,
    @InjectRepository(User) private readonly users: Repository<User>
  ) {}

  async create(dto: CreateTaskDto, userId?: number): Promise<Task> {
    try {
      if (!userId) {
        throw new Error('User ID is required to create a task');
      }

      // Find the user first
      const user = await this.users.findOne({ 
        where: { id: userId },
        relations: ['organization']
      });
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      if (!user.organization) {
        throw new Error('User must belong to an organization to create tasks');
      }

      console.log('Creating task with DTO:', dto);

      // Handle assignedTo validation and assignment
      let assignedToUser = null;
      if (dto.assignedTo) {
        assignedToUser = await this.users.findOne({ 
          where: { id: parseInt(dto.assignedTo) },
          relations: ['organization']
        });
        
        if (!assignedToUser) {
          throw new Error(`Assigned user with ID ${dto.assignedTo} not found`);
        }
        
        // Verify the assigned user is in the same organization
        if (assignedToUser.organization.id !== user.organization.id) {
          throw new Error('Can only assign tasks to users in the same organization');
        }
      }

      // Create the task entity with explicit property assignment
      const entity = new Task();
      entity.title = dto.title;
      entity.description = dto.description || null;
      entity.status = dto.status || 'To Do';
      entity.category = dto.category || 'Work';
      entity.priority = dto.priority || 'Medium';
      entity.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
      entity.assignedBy = user;
      entity.assignedTo = assignedToUser;
      entity.organization = user.organization;

      console.log('Task entity before save:', {
        title: entity.title,
        description: entity.description,
        status: entity.status,
        category: entity.category,
        priority: entity.priority,
        dueDate: entity.dueDate
      });

      const saved = await this.repo.save(entity);
      console.log('Task saved successfully:', saved.id);
      return saved;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  findAll(organizationId?: number): Promise<Task[]> {
    if (!organizationId) return this.repo.find();
    return this.repo.find({ where: { organization: { id: organizationId } } as any });
  }

  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    return this.users.find({ 
      where: { organization: { id: organizationId }, isActive: true },
      relations: ['organization']
    });
  }

  async update(id: number, dto: UpdateTaskDto, userId?: number): Promise<Task | null> {
    // Get the existing task first
    const existingTask = await this.repo.findOne({ 
      where: { id },
      relations: ['organization', 'assignedBy']
    });
    
    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    // Handle assignedTo validation if it's being updated
    let assignedToUser = undefined;
    if (dto.assignedTo !== undefined) {
      if (dto.assignedTo) {
        assignedToUser = await this.users.findOne({ 
          where: { id: parseInt(dto.assignedTo) },
          relations: ['organization']
        });
        
        if (!assignedToUser) {
          throw new Error(`Assigned user with ID ${dto.assignedTo} not found`);
        }
        
        // Verify the assigned user is in the same organization as the task
        if (assignedToUser.organization.id !== existingTask.organization.id) {
          throw new Error('Can only assign tasks to users in the same organization');
        }
      } else {
        // If assignedTo is null/empty, unassign the task
        assignedToUser = null;
      }
    }

    // Update the task
    const updateData: any = { ...dto };
    if (assignedToUser !== undefined) {
      updateData.assignedTo = assignedToUser;
    }
    
    await this.repo.update({ id }, updateData);
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  async remove(id: number): Promise<{ success: boolean }> {
    await this.repo.delete({ id });
    return { success: true };
  }
}
