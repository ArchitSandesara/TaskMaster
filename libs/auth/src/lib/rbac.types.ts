import { Permission, RoleName } from 'data';

export type RoleHierarchy = {
  [key in RoleName]: RoleName[]; // roles inherited by key
};

export const DEFAULT_ROLE_HIERARCHY: RoleHierarchy = {
  [RoleName.OWNER]: [RoleName.ADMIN, RoleName.VIEWER],
  [RoleName.ADMIN]: [RoleName.VIEWER],
  [RoleName.VIEWER]: [],
};

export type RolePermissions = Record<RoleName, Permission[]>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  [RoleName.OWNER]: [
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.READ_AUDIT_LOG,
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.CREATE_ORGANIZATION,
    Permission.READ_ORGANIZATION,
    Permission.UPDATE_ORGANIZATION,
    Permission.DELETE_ORGANIZATION,
  ],
  [RoleName.ADMIN]: [
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.READ_AUDIT_LOG,
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.CREATE_ORGANIZATION,
    Permission.READ_ORGANIZATION,
    Permission.UPDATE_ORGANIZATION,
    Permission.DELETE_ORGANIZATION,
    Permission.UPDATE_ORGANIZATION,
  ],
  [RoleName.VIEWER]: [Permission.READ_TASK, Permission.READ_USER, Permission.READ_ORGANIZATION],
};
