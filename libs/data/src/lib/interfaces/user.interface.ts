export interface IUser {
  id: number;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  organizationId: number;
  roleId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: number;
  role: IRole;
  organization: IOrganization;
}

export interface IRole {
  id: number;
  name: RoleName;
  permissions: Permission[];
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganization {
  id: number;
  name: string;
  parentId?: number;
  ownerId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum RoleName {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  VIEWER = 'Viewer'
}

export enum Permission {
  // Task permissions
  CREATE_TASK = 'create_task',
  READ_TASK = 'read_task',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  
  // User permissions
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  
  // Organization permissions
  CREATE_ORGANIZATION = 'create_organization',
  READ_ORGANIZATION = 'read_organization',
  UPDATE_ORGANIZATION = 'update_organization',
  DELETE_ORGANIZATION = 'delete_organization',
  
  // Audit permissions
  READ_AUDIT_LOG = 'read_audit_log'
}