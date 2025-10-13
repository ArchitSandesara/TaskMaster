import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from 'data';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization) private readonly repo: Repository<Organization>
  ) {}

  async findAll(): Promise<Organization[]> {
    return this.repo.find({
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Organization> {
    const organization = await this.repo.findOne({ where: { id } });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ForbiddenException('Organization name already exists');
    }

    const organization = this.repo.create({
      name: dto.name,
      isActive: true
    });
    
    return this.repo.save(organization);
  }

  async update(id: number, dto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);
    
    if (dto.name && dto.name !== organization.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing && existing.id !== id) {
        throw new ForbiddenException('Organization name already exists');
      }
    }

    Object.assign(organization, dto);
    return this.repo.save(organization);
  }

  async disable(id: number): Promise<{ success: boolean; message: string }> {
    const organization = await this.findOne(id);
    
    if (!organization.isActive) {
      throw new ForbiddenException('Organization is already disabled');
    }
    
    organization.isActive = false;
    await this.repo.save(organization);
    
    return { success: true, message: 'Organization disabled successfully' };
  }

  async enable(id: number): Promise<{ success: boolean; message: string }> {
    const organization = await this.repo.findOne({ where: { id } });
    
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    
    if (organization.isActive) {
      throw new ForbiddenException('Organization is already enabled');
    }
    
    organization.isActive = true;
    await this.repo.save(organization);
    
    return { success: true, message: 'Organization enabled successfully' };
  }
}