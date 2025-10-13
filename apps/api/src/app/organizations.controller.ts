import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CreateOrganizationDto, UpdateOrganizationDto, Permission } from 'data';
import { JwtAuthGuard, Permissions, PermissionsGuard, CurrentUser } from 'auth';
import { OrganizationService } from './organization.service';
import { AuditLogService } from './audit-log.service';
import { AuditAction, ResourceType } from 'data';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly audit: AuditLogService
  ) {}

  @Get()
  async list() {
    return this.organizationService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.READ_ORGANIZATION)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findOne(id);
  }

  @Post()
  @Permissions(Permission.CREATE_ORGANIZATION)
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: any) {
    const organization = await this.organizationService.create(dto);
    this.audit.log({
      action: AuditAction.CREATE,
      resourceType: ResourceType.ORGANIZATION,
      resourceId: organization.id.toString(),
      resourceName: organization.name,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: organization.name,
      metadata: {
        createdOrganization: {
          name: organization.name,
          isActive: organization.isActive
        }
      }
    });
    return organization;
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_ORGANIZATION)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrganizationDto, @CurrentUser() user: any) {
    // Get the organization before update to track changes
    const originalOrganization = await this.organizationService.findOne(id);
    const organization = await this.organizationService.update(id, dto);
    
    this.audit.log({
      action: AuditAction.UPDATE,
      resourceType: ResourceType.ORGANIZATION,
      resourceId: id.toString(),
      resourceName: organization.name,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: organization.name,
      metadata: {
        updatedOrganization: {
          name: organization.name,
          isActive: organization.isActive
        },
        changes: dto,
        previousValues: originalOrganization ? {
          name: originalOrganization.name,
          isActive: originalOrganization.isActive
        } : null
      }
    });
    return organization;
  }

  @Put(':id/disable')
  @Permissions(Permission.UPDATE_ORGANIZATION)
  async disable(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const organization = await this.organizationService.findOne(id);
    const result = await this.organizationService.disable(id);
    this.audit.log({
      action: AuditAction.DISABLE,
      resourceType: ResourceType.ORGANIZATION,
      resourceId: id.toString(),
      resourceName: organization.name,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: organization.name,
      metadata: {
        updatedOrganization: {
          name: organization.name,
          isActive: false
        }
      }
    });
    return result;
  }

  @Put(':id/enable')
  @Permissions(Permission.UPDATE_ORGANIZATION)
  async enable(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const organization = await this.organizationService.findOne(id);
    const result = await this.organizationService.enable(id);
    this.audit.log({
      action: AuditAction.ENABLE,
      resourceType: ResourceType.ORGANIZATION,
      resourceId: id.toString(),
      resourceName: organization.name,
      userId: user.sub,
      userEmail: user.email,
      userName: user.username,
      organizationId: user.organizationId,
      organizationName: organization.name,
      metadata: {
        updatedOrganization: {
          name: organization.name,
          isActive: true
        }
      }
    });
    return result;
  }
}