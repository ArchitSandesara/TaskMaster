import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { decodeJwt } from './jwt.util';

@Component({
  selector: 'app-organization-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded shadow p-6" [ngClass]="theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">Manage Organizations</h2>
        <button 
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          (click)="showCreateModal = true"
        >
          + Create Organization
        </button>
      </div>

      <!-- Organizations Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">
          <thead>
            <tr [ngClass]="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'">
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Organization Name</th>
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Status</th>
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Created</th>
              <th class="border px-4 py-2 text-center" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let org of organizations" [ngClass]="theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'">
              <td class="border px-4 py-2 font-medium" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">{{ org.name }}</td>
              <td class="border px-4 py-2" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">
                <span 
                  class="px-2 py-1 rounded text-xs"
                  [class.bg-green-100]="org.isActive && theme !== 'dark'"
                  [class.text-green-800]="org.isActive && theme !== 'dark'"
                  [class.bg-red-100]="!org.isActive && theme !== 'dark'"
                  [class.text-red-800]="!org.isActive && theme !== 'dark'"
                  [class.bg-green-800]="org.isActive && theme === 'dark'"
                  [class.text-green-200]="org.isActive && theme === 'dark'"
                  [class.bg-red-800]="!org.isActive && theme === 'dark'"
                  [class.text-red-200]="!org.isActive && theme === 'dark'"
                >
                  {{ org.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="border px-4 py-2 text-sm" [ngClass]="theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'">
                {{ org.createdAt | date:'yyyy-MM-dd' }}
              </td>
              <td class="border px-4 py-2 text-center" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">
                <div class="flex gap-2 justify-center">
                  <button 
                    class="text-blue-600 hover:underline text-sm"
                    (click)="editOrganization(org)"
                  >
                    Edit
                  </button>
                  <button 
                    *ngIf="org.isActive && org.id !== currentUserOrgId"
                    class="text-red-600 hover:underline text-sm"
                    (click)="disableOrganization(org)"
                  >
                    Disable
                  </button>
                  <button 
                    *ngIf="!org.isActive"
                    class="text-green-600 hover:underline text-sm"
                    (click)="enableOrganization(org)"
                  >
                    Enable
                  </button>
                  <span 
                    *ngIf="org.id === currentUserOrgId"
                    class="text-gray-500 text-sm"
                  >
                    Current
                  </span>
                </div>
              </td>
            </tr>
            <tr *ngIf="organizations.length === 0">
              <td colspan="4" class="border px-4 py-8 text-center" [ngClass]="theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'">
                No organizations found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showCreateModal || editOrgObj" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="rounded shadow-lg p-8 w-full max-w-md" [ngClass]="theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'">
          <h3 class="text-lg font-bold mb-4">
            {{ editOrgObj ? 'Edit Organization' : 'Create Organization' }}
          </h3>
          
          <form (ngSubmit)="saveOrganization()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Organization Name</label>
              <input 
                class="border p-2 w-full rounded" 
                [ngClass]="theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'"
                placeholder="Enter organization name" 
                [(ngModel)]="orgForm.name" 
                name="name" 
                required 
              />
            </div>
            
            <div *ngIf="editOrgObj">
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  [(ngModel)]="orgForm.isActive" 
                  name="isActive"
                  class="mr-2"
                />
                <span class="text-sm" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Active</span>
              </label>
            </div>

            <div *ngIf="errorMessage" class="text-red-600 text-sm">
              {{ errorMessage }}
            </div>

            <div class="flex gap-2 justify-end">
              <button 
                type="button" 
                class="px-4 py-2 rounded border"
                [ngClass]="theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
                (click)="closeModal()"
              >
                Cancel
              </button>
              <button 
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                type="submit"
                [disabled]="isLoading"
              >
                {{ isLoading ? 'Saving...' : (editOrgObj ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class OrganizationManagerComponent implements OnInit {
  @Input() theme: 'light' | 'dark' = 'light';
  
  organizations: any[] = [];
  showCreateModal = false;
  editOrgObj: any = null;
  orgForm = { name: '', isActive: true };
  isLoading = false;
  errorMessage = '';

  constructor(private http: HttpClient, private api: ApiService) {}

  ngOnInit() {
    this.loadOrganizations();
  }

  get currentUserOrgId(): string {
    const token = localStorage.getItem('access_token');
    const payload = decodeJwt(token || '');
    return payload?.organizationId || '';
  }

  loadOrganizations() {
    this.http.get<any[]>(`${this.api.baseUrl}/organizations`).subscribe({
      next: (orgs) => {
        this.organizations = orgs;
      },
      error: (error) => {
        console.error('Failed to load organizations:', error);
      }
    });
  }

  editOrganization(org: any) {
    this.editOrgObj = org;
    this.orgForm = { name: org.name, isActive: org.isActive };
    this.errorMessage = '';
  }

  disableOrganization(org: any) {
    if (confirm(`Are you sure you want to disable "${org.name}"? This will prevent users from accessing this organization.`)) {
      this.http.put(`${this.api.baseUrl}/organizations/${org.id}/disable`, {}).subscribe({
        next: (response: any) => {
          alert(response.message || 'Organization disabled successfully');
          this.loadOrganizations();
        },
        error: (error) => {
          alert('Failed to disable organization: ' + (error.error?.message || 'Unknown error'));
        }
      });
    }
  }

  enableOrganization(org: any) {
    if (confirm(`Are you sure you want to enable "${org.name}"?`)) {
      this.http.put(`${this.api.baseUrl}/organizations/${org.id}/enable`, {}).subscribe({
        next: (response: any) => {
          alert(response.message || 'Organization enabled successfully');
          this.loadOrganizations();
        },
        error: (error) => {
          alert('Failed to enable organization: ' + (error.error?.message || 'Unknown error'));
        }
      });
    }
  }

  saveOrganization() {
    if (!this.orgForm.name?.trim()) {
      this.errorMessage = 'Organization name is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const operation = this.editOrgObj 
      ? this.http.put(`${this.api.baseUrl}/organizations/${this.editOrgObj.id}`, this.orgForm)
      : this.http.post(`${this.api.baseUrl}/organizations`, this.orgForm);

    operation.subscribe({
      next: () => {
        this.closeModal();
        this.loadOrganizations();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to save organization';
      }
    });
  }

  closeModal() {
    this.showCreateModal = false;
    this.editOrgObj = null;
    this.orgForm = { name: '', isActive: true };
    this.errorMessage = '';
    this.isLoading = false;
  }
}