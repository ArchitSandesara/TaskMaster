import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './auth.decorators';
import { Permission, RoleName } from 'data';
import { hasPermission } from './rbac.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
  const user = request.user as { roleName: RoleName; organizationId: number; sub: number };

    for (const perm of required) {
      if (!hasPermission(user.roleName, perm)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
