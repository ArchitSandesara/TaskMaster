import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { decodeJwt } from './jwt.util';

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded shadow p-6" [ngClass]="theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">Manage Users</h2>
        <button 
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          (click)="showCreateModal = true; loadRoles()"
        >
          + Create User
        </button>
      </div>

      <!-- Users Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">
          <thead>
            <tr [ngClass]="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'">
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Name</th>
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Username</th>
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Email</th>
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Role</th>
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Organization</th>
              <th class="border px-4 py-2 text-left" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Status</th>
              <th class="border px-4 py-2 text-center" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users" [ngClass]="theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-50'">
              <td class="border px-4 py-2 font-medium" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">
                {{ user.firstName }} {{ user.lastName }}
              </td>
              <td class="border px-4 py-2" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">{{ user.username }}</td>
              <td class="border px-4 py-2" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">{{ user.email }}</td>
              <td class="border px-4 py-2" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">
                <span class="px-2 py-1 rounded text-xs" [ngClass]="theme === 'dark' ? 'bg-blue-700 text-blue-200' : 'bg-blue-100 text-blue-800'">
                  {{ user.role?.name }}
                </span>
              </td>
              <td class="border px-4 py-2" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">{{ user.organization?.name }}</td>
              <td class="border px-4 py-2" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">
                <span 
                  class="px-2 py-1 rounded text-xs"
                  [ngClass]="{
                    'bg-green-700 text-green-200': user.isActive && theme === 'dark',
                    'bg-green-100 text-green-800': user.isActive && theme === 'light',
                    'bg-red-700 text-red-200': !user.isActive && theme === 'dark',
                    'bg-red-100 text-red-800': !user.isActive && theme === 'light'
                  }"
                >
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="border px-4 py-2 text-center" [ngClass]="theme === 'dark' ? 'border-gray-600' : 'border-gray-300'">
                <div class="flex gap-2 justify-center">
                  <button 
                    class="text-blue-600 hover:underline text-sm"
                    (click)="editUser(user)"
                  >
                    Edit
                  </button>
                  <button 
                    class="text-red-600 hover:underline text-sm"
                    (click)="deleteUser(user)"
                    [disabled]="user.id === currentUserId"
                  >
                    {{ user.id === currentUserId ? 'Current' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="users.length === 0">
              <td colspan="7" class="border px-4 py-8 text-center" [ngClass]="theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'">
                No users found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showCreateModal || editUserObj" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="rounded shadow-lg p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" [ngClass]="theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'">
          <h3 class="text-lg font-bold mb-4">
            {{ editUserObj ? 'Edit User' : 'Create User' }}
          </h3>
          
          <form (ngSubmit)="saveUser()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">First Name</label>
                <input 
                  class="border p-2 w-full rounded" 
                  [ngClass]="theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'"
                  placeholder="First name" 
                  [(ngModel)]="userForm.firstName" 
                  name="firstName" 
                  required 
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Last Name</label>
                <input 
                  class="border p-2 w-full rounded" 
                  [ngClass]="theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'"
                  placeholder="Last name" 
                  [(ngModel)]="userForm.lastName" 
                  name="lastName" 
                  required 
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Username</label>
              <input 
                class="border p-2 w-full rounded" 
                [ngClass]="theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'"
                placeholder="Username" 
                [(ngModel)]="userForm.username" 
                name="username" 
                required 
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Email</label>
              <input 
                class="border p-2 w-full rounded" 
                [ngClass]="theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'"
                type="email"
                placeholder="Email address" 
                [(ngModel)]="userForm.email" 
                name="email" 
                required 
              />
            </div>

            <div *ngIf="!editUserObj">
              <label class="block text-sm font-medium mb-1" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Password</label>
              <input 
                class="border p-2 w-full rounded" 
                [ngClass]="theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'"
                type="password"
                placeholder="Password (min 6 characters)" 
                [(ngModel)]="userForm.password" 
                name="password" 
                minlength="6"
                required 
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Organization</label>
              <select 
                class="border p-2 w-full rounded" 
                [ngClass]="theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'"
                [(ngModel)]="userForm.organizationId" 
                name="organizationId"
                (change)="onOrganizationChange()"
                required
              >
                <option value="">Select organization...</option>
                <option *ngFor="let org of organizations" [value]="org.id">{{ org.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" [ngClass]="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Role</label>
              <select 
                class="border p-2 w-full rounded" 
                [ngClass]="theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'"
                [(ngModel)]="userForm.roleId" 
                name="roleId"
                required
              >
                <option value="">Select role...</option>
                <option *ngFor="let role of availableRoles" [value]="role.id">{{ role.name }}</option>
              </select>
            </div>

            <div *ngIf="errorMessage" [ngClass]="theme === 'dark' ? 'text-red-400' : 'text-red-600'" class="text-sm">
              {{ errorMessage }}
            </div>

            <div class="flex gap-2 justify-end">
              <button 
                type="button" 
                class="px-4 py-2 rounded border" 
                [ngClass]="theme === 'dark' ? 'border-gray-600 hover:bg-gray-600 text-white' : 'border-gray-300 hover:bg-gray-50 text-black'"
                (click)="closeModal()"
              >
                Cancel
              </button>
              <button 
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                type="submit"
                [disabled]="isLoading"
              >
                {{ isLoading ? 'Saving...' : (editUserObj ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class UserManagerComponent implements OnInit {
  @Input() theme: 'light' | 'dark' = 'light';
  
  users: any[] = [];
  organizations: any[] = [];
  availableRoles: any[] = [];
  showCreateModal = false;
  editUserObj: any = null;
  userForm = { 
    firstName: '', 
    lastName: '', 
    username: '', 
    email: '', 
    password: '', 
    organizationId: '', 
    roleId: '' 
  };
  isLoading = false;
  errorMessage = '';

  constructor(private http: HttpClient, private api: ApiService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadOrganizations();
  }

  get currentUserId(): string {
    const token = localStorage.getItem('access_token');
    const payload = decodeJwt(token || '');
    return payload?.sub || '';
  }

  loadUsers() {
    this.http.get<any[]>(`${this.api.baseUrl}/users`).subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
      }
    });
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

  loadRoles() {
    if (this.userForm.organizationId) {
      this.http.get<any[]>(`${this.api.baseUrl}/users/roles/${this.userForm.organizationId}`).subscribe({
        next: (roles) => {
          this.availableRoles = roles;
        },
        error: (error) => {
          console.error('Failed to load roles:', error);
          this.availableRoles = [];
        }
      });
    }
  }

  onOrganizationChange() {
    this.userForm.roleId = '';
    this.loadRoles();
  }

  editUser(user: any) {
    this.editUserObj = user;
    this.userForm = { 
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      password: '',
      organizationId: user.organization?.id || '',
      roleId: user.role?.id || ''
    };
    this.loadRoles();
    this.errorMessage = '';
  }

  deleteUser(user: any) {
    if (user.id === this.currentUserId) {
      alert('Cannot delete your current account');
      return;
    }

    if (confirm(`Are you sure you want to delete "${user.firstName} ${user.lastName}"?`)) {
      this.http.delete(`${this.api.baseUrl}/users/${user.id}`).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          alert('Failed to delete user: ' + (error.error?.message || 'Unknown error'));
        }
      });
    }
  }

  saveUser() {
    if (!this.userForm.firstName?.trim() || !this.userForm.lastName?.trim() || !this.userForm.username?.trim() || 
        !this.userForm.email?.trim() || !this.userForm.organizationId || !this.userForm.roleId) {
      this.errorMessage = 'All fields except password are required';
      return;
    }

    if (!this.editUserObj && !this.userForm.password?.trim()) {
      this.errorMessage = 'Password is required for new users';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: any = {
      firstName: this.userForm.firstName,
      lastName: this.userForm.lastName,
      username: this.userForm.username,
      email: this.userForm.email,
      organizationId: this.userForm.organizationId,
      roleId: this.userForm.roleId
    };

    if (!this.editUserObj) {
      payload.password = this.userForm.password;
    }

    const operation = this.editUserObj 
      ? this.http.put(`${this.api.baseUrl}/users/${this.editUserObj.id}`, payload)
      : this.http.post(`${this.api.baseUrl}/users`, payload);

    operation.subscribe({
      next: () => {
        this.closeModal();
        this.loadUsers();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to save user';
      }
    });
  }

  closeModal() {
    this.showCreateModal = false;
    this.editUserObj = null;
    this.userForm = { 
      firstName: '', 
      lastName: '', 
      username: '', 
      email: '', 
      password: '', 
      organizationId: '', 
      roleId: '' 
    };
    this.availableRoles = [];
    this.errorMessage = '';
    this.isLoading = false;
  }
}