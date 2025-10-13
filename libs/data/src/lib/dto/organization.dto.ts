import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';
}

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class OrganizationResponseDto {
  id: string = '';
  name: string = '';
  isActive: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  usersCount?: number;
  tasksCount?: number;
}
