import { Permission, RoleName } from 'data';
import { DEFAULT_ROLE_HIERARCHY, DEFAULT_ROLE_PERMISSIONS } from './rbac.types';

export function getInheritedRoles(role: RoleName): Set<RoleName> {
  const result = new Set<RoleName>([role]);
  const stack = [role];
  while (stack.length) {
    const current = stack.pop()!;
    const inherited = DEFAULT_ROLE_HIERARCHY[current] ?? [];
    for (const r of inherited) {
      if (!result.has(r)) {
        result.add(r);
        stack.push(r);
      }
    }
  }
  return result;
}

export function getPermissionsForRole(role: RoleName): Set<Permission> {
  const roles = getInheritedRoles(role);
  const perms = new Set<Permission>();
  for (const r of roles) {
    (DEFAULT_ROLE_PERMISSIONS[r] ?? []).forEach((p) => perms.add(p));
  }
  return perms;
}

export function hasPermission(role: RoleName, permission: Permission): boolean {
  return getPermissionsForRole(role).has(permission);
}
