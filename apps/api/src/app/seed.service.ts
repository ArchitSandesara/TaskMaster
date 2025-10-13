import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';
import { DEFAULT_ROLE_PERMISSIONS } from 'auth';
import { RoleName } from 'data';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>
  ) {}

  async onModuleInit() {
    const reset = (process.env.SEED_RESET || '').toLowerCase() === 'true';
    const count = await this.users.count();

    if (reset) {
      this.logger.log('SEED_RESET=true detected. Resetting database and reseeding baseline data...');
      await this.resetDatabase();
      await this.seedBaseline();
      return;
    }

    if (count > 0) {
      this.logger.log('Seed skipped: users already exist');
      return;
    }

    await this.seedBaseline();
  }

  private async resetDatabase() {
    // Delete in dependency-safe order
    await this.tasks.delete({});
    await this.users.delete({});
    await this.roles.delete({});
    await this.orgs.delete({});
  }

  private async seedBaseline() {
    this.logger.log('Seeding default organization, roles, and users...');

    // Create organization (IDs are UUIDs by schema)
    let org = this.orgs.create({ name: 'Archit.Org' });
    org = await this.orgs.save(org);

    // Ensure roles for the organization
    const ensureRole = async (name: RoleName) => {
      let role = await this.roles.findOne({ where: { name, organization: { id: org.id } } });
      if (!role) {
        role = this.roles.create({
          name,
          organization: org,
          permissions: (DEFAULT_ROLE_PERMISSIONS[name] ?? []).map(String),
        });
        role = await this.roles.save(role);
      }
      return role;
    };

    const ownerRole = await ensureRole(RoleName.OWNER);
    const adminRole = await ensureRole(RoleName.ADMIN);
    const viewerRole = await ensureRole(RoleName.VIEWER);

    // Helper to create user with lowercase names as requested
    const createUser = async (
      email: string,
      username: string,
      firstName: string,
      lastName: string,
      role: Role
    ) => {
      const password = await bcrypt.hash('password', 10);
      const user = this.users.create({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password,
        firstName,
        lastName,
        organization: org,
        role,
        isActive: true,
      });
      return this.users.save(user);
    };

    await createUser('owner@example.com', 'owner', 'owner', 'owner', ownerRole);
    await createUser('admin@example.com', 'admin', 'admin', 'admin', adminRole);
    await createUser('viewer@example.com', 'viewer', 'viewer', 'viewer', viewerRole);

    this.logger.log('Seed complete: created owner/admin/viewer with password "password"');
  }
}
