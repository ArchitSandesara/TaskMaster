import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Role } from './entities/role.entity';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, JwtPayload, LoginDto, RegisterDto, RoleName, AuditAction, ResourceType } from 'data';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_ROLE_PERMISSIONS } from 'auth';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly jwt: JwtService,
    private readonly audit: AuditLogService,
  ) {}

  async register(dto: RegisterDto, requestInfo?: { ipAddress?: string; userAgent?: string }) {
    const emailLower = dto.email.toLowerCase();
    const usernameLower = dto.username.toLowerCase();
    const existingEmail = await this.users.findOne({ where: { email: emailLower } });
    if (existingEmail) throw new UnauthorizedException('Email already registered');
    
    const existingUsername = await this.users.findOne({ where: { username: usernameLower } });
    if (existingUsername) throw new UnauthorizedException('Username already taken');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Organization: handle organization lookup or creation
    let org: Organization | null = null;
    if (dto.organizationId) {
      // Join existing organization by ID
      org = await this.orgs.findOne({ where: { id: dto.organizationId } });
      if (!org) throw new UnauthorizedException('Organization not found');
    } else if (dto.organizationName) {
      // Create new organization with provided name
      const existingOrg = await this.orgs.findOne({ where: { name: dto.organizationName } });
      if (existingOrg) throw new UnauthorizedException(`Organization '${dto.organizationName}' already exists`);
      org = this.orgs.create({ name: dto.organizationName });
      org = await this.orgs.save(org);
    } else {
      // Create new organization with default name if neither ID nor name provided
      org = this.orgs.create({ name: `${dto.firstName}'s Org` });
      org = await this.orgs.save(org);
    }

    const roleName: RoleName = dto.roleName;
    let role = await this.roles.findOne({ where: { name: roleName, organization: { id: org!.id } } });
    if (!role) {
      role = this.roles.create({
        name: roleName,
        organization: org!,
        permissions: (DEFAULT_ROLE_PERMISSIONS[roleName] ?? []).map(String),
      });
      role = await this.roles.save(role);
    }

    let user = this.users.create({
      email: emailLower,
      username: usernameLower,
      password: passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      organization: org!,
      role: role!,
    });
    user = await this.users.save(user);
    
    // Log user registration
    this.audit.log({
      userId: user.id.toString(),
      userEmail: user.email,
      userName: user.username,
      action: AuditAction.CREATE,
      resourceType: ResourceType.USER,
      resourceId: user.id.toString(),
      resourceName: `${user.firstName} ${user.lastName}`,
      organizationId: org!.id.toString(),
      organizationName: org!.name,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
      metadata: { registrationMethod: 'email', roleName: roleName }
    });
    
    return { id: user.id, email: user.email };
  }

  async login(dto: LoginDto, requestInfo?: { ipAddress?: string; userAgent?: string }) {
    const emailLower = dto.email.toLowerCase();
    const user = await this.users.findOne({ 
      where: { email: emailLower },
      relations: ['organization', 'role']
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      organizationId: user.organization.id,
      organizationName: user.organization.name,
      roleId: user.role.id,
      roleName: user.role.name as RoleName,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    
    // Log successful login
    this.audit.log({
      userId: user.id.toString(),
      userEmail: user.email,
      userName: user.username,
      action: AuditAction.LOGIN,
      resourceType: ResourceType.USER,
      resourceId: user.id.toString(),
      resourceName: `${user.firstName} ${user.lastName}`,
      organizationId: user.organization.id.toString(),
      organizationName: user.organization.name,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
      metadata: { loginMethod: 'email' }
    });
    
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }
}
