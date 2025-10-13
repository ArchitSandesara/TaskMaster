import { IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { TaskStatus, TaskCategory, TaskPriority } from '../interfaces/task.interface';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string = '';

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status: TaskStatus = TaskStatus.TODO;

  @IsString()
  @IsOptional()
  category: TaskCategory = TaskCategory.WORK;

  @IsString()
  @IsOptional()
  priority: TaskPriority = TaskPriority.MEDIUM;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: Date;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  category?: TaskCategory;

  @IsString()
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: Date;
}

export class TaskFilterDto {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  assignedTo?: string;
  search?: string;
  sortBy?: 'dueDate' | 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class TaskResponseDto {
  id: string = '';
  title: string = '';
  description?: string;
  status: TaskStatus = TaskStatus.TODO;
  category: TaskCategory = TaskCategory.WORK;
  priority: TaskPriority = TaskPriority.MEDIUM;
  assignedTo?: string;
  assignedBy: string = '';
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}