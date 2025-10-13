export interface IAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceName?: string;
  organizationId: string;
  organizationName?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ENABLE = 'ENABLE',
  DISABLE = 'DISABLE',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN'
}

export enum ResourceType {
  TASK = 'Task',
  USER = 'User',
  ORGANIZATION = 'Organization',
  ROLE = 'Role'
}