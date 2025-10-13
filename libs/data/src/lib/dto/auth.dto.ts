import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsInt } from 'class-validator';
import { RoleName } from '../interfaces/user.interface';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string = '';

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string = '';
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string = '';

  @IsString()
  @IsNotEmpty()
  username: string = '';

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string = '';

  @IsString()
  @IsNotEmpty()
  firstName: string = '';

  @IsString()
  @IsNotEmpty()
  lastName: string = '';

  @IsString()
  @IsOptional()
  organizationName?: string;

  @IsEnum(RoleName)
  @IsNotEmpty()
  roleName: RoleName = RoleName.VIEWER;

  @IsInt()
  @IsOptional()
  organizationId?: number;
}

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string = '';

  @IsString()
  @IsNotEmpty()
  username: string = '';

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string = '';

  @IsString()
  @IsNotEmpty()
  firstName: string = '';

  @IsString()
  @IsNotEmpty()
  lastName: string = '';

  @IsInt()
  organizationId: number = 0;

  @IsInt()
  roleId: number = 0;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsInt()
  @IsOptional()
  roleId?: number;
}

export class JwtPayload {
  sub: number = 0; // user id
  email: string = '';
  username: string = '';
  organizationId: number = 0;
  organizationName: string = '';
  roleId: number = 0;
  roleName: RoleName = RoleName.VIEWER;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}