import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'auth';
import { Organization } from './entities/organization.entity';
import { Role } from './entities/role.entity';
import { Task } from './entities/task.entity';
import { User } from './entities/user.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SeedService } from './seed.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationService } from './organization.service';
import { UsersController } from './users.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Organization, Role, Task],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Organization, Role, Task]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '2h' },
    }),
  ],
  controllers: [AppController, AuthController, TasksController, AuditLogController, OrganizationsController, UsersController],
  providers: [AppService, JwtStrategy, TasksService, AuditLogService, AuthService, SeedService, OrganizationService, UserService],
})
export class AppModule {}
