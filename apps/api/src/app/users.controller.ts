import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, Permission } from 'data';
import { JwtAuthGuard, Permissions, PermissionsGuard, CurrentUser } from 'auth';
import { UserService } from './user.service';
import { AuditLogService } from './audit-log.service';
import { AuditAction, ResourceType } from 'data';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly audit: AuditLogService
  ) {}

  @Get()
  @Permissions(Permission.READ_USER)
  async list(@CurrentUser() user: any, @Query('organizationId') organizationId?: number) {
    const orgId = organizationId || user.organizationId;
    const users = await this.userService.findAll(orgId);
    
    // Remove password from response
    return users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
  }

  @Get('roles/:organizationId')
  @Permissions(Permission.READ_USER)
    async getRoles(@Param('organizationId', ParseIntPipe) organizationId: number) {
    return this.userService.getRolesForOrganization(organizationId);
  }

  @Get(':id')
  @Permissions(Permission.READ_USER)
    async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne(id);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Post()
  @Permissions(Permission.CREATE_USER)
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    const createdUser = await this.userService.create(dto);
    this.audit.log({
      action: AuditAction.CREATE,
      resourceType: ResourceType.USER,
      resourceId: createdUser.id.toString(),
      resourceName: `${createdUser.firstName} ${createdUser.lastName}`,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: createdUser.organization?.name || 'Unknown',
      metadata: {
        createdUser: {
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          role: createdUser.role?.name,
          organizationId: createdUser.organization?.id
        }
      }
    });
    
    const { password, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_USER)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    // Get the user before update to track changes
    const originalUser = await this.userService.findOne(id);
    const updatedUser = await this.userService.update(id, dto);
    
    this.audit.log({
      action: AuditAction.UPDATE,
      resourceType: ResourceType.USER,
      resourceId: id.toString(),
      resourceName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: updatedUser.organization?.name || originalUser?.organization?.name || 'Unknown',
      metadata: {
        updatedUser: {
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role?.name,
          organizationId: updatedUser.organization?.id
        },
        changes: dto,
        previousValues: originalUser ? {
          email: originalUser.email,
          firstName: originalUser.firstName,
          lastName: originalUser.lastName,
          role: originalUser.role?.name,
          organizationId: originalUser.organization?.id
        } : null
      }
    });
    
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_USER)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    // Get user details before deletion for audit log
    const userToDelete = await this.userService.findOne(id);
    const result = await this.userService.remove(id);
    
    this.audit.log({
      action: AuditAction.DELETE,
      resourceType: ResourceType.USER,
      resourceId: id.toString(),
      resourceName: userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : `User ${id}`,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: userToDelete?.organization?.name || 'Unknown',
      metadata: {
        deletedUser: {
          email: userToDelete?.email,
          firstName: userToDelete?.firstName,
          lastName: userToDelete?.lastName,
          role: userToDelete?.role?.name
        }
      }
    });
    return result;
  }
}