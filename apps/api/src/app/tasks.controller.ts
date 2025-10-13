import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CreateTaskDto, TaskFilterDto, UpdateTaskDto, Permission, AuditAction, ResourceType } from 'data';
import { JwtAuthGuard, Permissions, PermissionsGuard, CurrentUser } from 'auth';
import { TasksService } from './tasks.service';
import { AuditLogService } from './audit-log.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService, private readonly audit: AuditLogService) {}

  @Post()
  @Permissions(Permission.CREATE_TASK)
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    const res = await this.tasks.create(dto, user?.sub);
    this.audit.log({
      action: AuditAction.CREATE,
      resourceType: ResourceType.TASK,
      resourceId: res.id.toString(),
      resourceName: res.title || dto.title,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: res.organization?.name || 'Unknown',
      metadata: {
        createdTask: {
          title: res.title,
          category: res.category,
          status: res.status,
          priority: res.priority,
          description: res.description,
          dueDate: res.dueDate,
          assignedTo: res.assignedTo ? `${res.assignedTo.firstName} ${res.assignedTo.lastName}` : null
        }
      }
    });
    return res;
  }

  @Get('users')
  @Permissions(Permission.READ_TASK)
  async getUsersInOrganization(@CurrentUser() user: any) {
    return this.tasks.getUsersByOrganization(user?.organizationId);
  }

  @Get()
  @Permissions(Permission.READ_TASK)
  async list(@Query() query: TaskFilterDto, @CurrentUser() user: any) { return this.tasks.findAll(user?.organizationId); }

  @Put(':id')
  @Permissions(Permission.UPDATE_TASK)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto, @CurrentUser() user: any) {
  // Get the task before update to track changes
  const originalTask = await this.tasks['repo'].findOne({ where: { id }, relations: ['organization', 'assignedTo'] });
    const res = await this.tasks.update(id, dto, user?.sub);
    
    this.audit.log({
      action: AuditAction.UPDATE,
      resourceType: ResourceType.TASK,
      resourceId: id.toString(),
      resourceName: res.title || originalTask?.title || `Task ${id}`,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: res.organization?.name || originalTask?.organization?.name || 'Unknown',
      metadata: {
        updatedTask: {
          title: res.title,
          category: res.category,
          status: res.status,
          priority: res.priority,
          description: res.description,
          dueDate: res.dueDate,
          assignedTo: res.assignedTo ? `${res.assignedTo.firstName} ${res.assignedTo.lastName}` : null
        },
        changes: dto,
        previousValues: originalTask ? {
          title: originalTask.title,
          category: originalTask.category,
          status: originalTask.status,
          priority: originalTask.priority,
          description: originalTask.description,
          dueDate: originalTask.dueDate,
          assignedTo: originalTask.assignedTo ? `${originalTask.assignedTo.firstName} ${originalTask.assignedTo.lastName}` : null
        } : null
      }
    });
    return res;
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_TASK)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
  // Get task details before deletion for audit log
  const taskToDelete = await this.tasks['repo'].findOne({ where: { id }, relations: ['organization', 'assignedTo'] });
    const res = await this.tasks.remove(id);
    
    this.audit.log({
      action: AuditAction.DELETE,
      resourceType: ResourceType.TASK,
      resourceId: id.toString(),
      resourceName: taskToDelete?.title || `Task ${id}`,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: taskToDelete?.organization?.name || 'Unknown',
      metadata: {
        deletedTask: {
          title: taskToDelete?.title,
          category: taskToDelete?.category,
          status: taskToDelete?.status,
          priority: taskToDelete?.priority,
          assignedTo: taskToDelete?.assignedTo ? `${taskToDelete.assignedTo.firstName} ${taskToDelete.assignedTo.lastName}` : null
        }
      }
    });
    return res;
  }
}
