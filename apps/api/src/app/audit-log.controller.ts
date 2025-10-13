import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard, Permissions, PermissionsGuard } from 'auth';
import { Permission, AuditAction, ResourceType } from 'data';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly audit: AuditLogService) {}

  @Get()
  @Permissions(Permission.READ_AUDIT_LOG)
  list(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('resourceType') resourceType?: ResourceType
  ) {
    if (userId) {
      return this.audit.findByUserId(userId);
    }
    if (action) {
      return this.audit.findByAction(action);
    }
    if (resourceType) {
      return this.audit.findByResourceType(resourceType);
    }
    return this.audit.all();
  }
}
