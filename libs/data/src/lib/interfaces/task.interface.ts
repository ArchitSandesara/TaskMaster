export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  assignedTo?: string;
  assignedBy: string;
  organizationId: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Complete'
}

export enum TaskCategory {
  WORK = 'Work',
  PERSONAL = 'Personal',
  BACKEND = 'Backend',
  FRONTEND = 'Frontend',
  DESIGN = 'Design',
  TESTING = 'Testing'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export interface ITaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  assignedTo?: string;
  search?: string;
  sortBy?: 'dueDate' | 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface ITaskStats {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  overdueCount: number;
}