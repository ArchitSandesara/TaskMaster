import { Permission, RoleName } from '../interfaces/user.interface';

export class CreateRoleDto {
  name: RoleName = RoleName.VIEWER;
  permissions?: Permission[];
}

export class UpdateRoleDto {
  permissions?: Permission[];
}
