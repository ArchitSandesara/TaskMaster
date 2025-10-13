import { Injectable } from '@nestjs/common';
import { AuditAction, IAuditLog, ResourceType } from 'data';
import { randomUUID } from 'crypto';

@Injectable()
export class AuditLogService {
  private logs: IAuditLog[] = [];

  constructor() {
    // Start with empty logs - will be populated by real user actions
  }

  log(entry: Omit<IAuditLog, 'id' | 'timestamp'>) {
    const auditLog: IAuditLog = { 
      id: randomUUID(), 
      timestamp: new Date(), 
      ...entry 
    };
    this.logs.unshift(auditLog);
    console.log('Audit Log:', auditLog);
  }

  all() {
    // Return logs sorted by timestamp (newest first)
    return this.logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findByUserId(userId: string) {
    return this.logs.filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findByAction(action: AuditAction) {
    return this.logs.filter(log => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findByResourceType(resourceType: ResourceType) {
    return this.logs.filter(log => log.resourceType === resourceType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }


}
