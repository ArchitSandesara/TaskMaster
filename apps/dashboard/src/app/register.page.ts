import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="bg-white p-8 rounded shadow w-96">
        <h1 class="text-2xl font-bold mb-6 text-center">Create Account - TaskMaster</h1>
        
        <form class="space-y-4" (ngSubmit)="register()">
          <!-- Personal Information -->
          <div class="grid grid-cols-2 gap-3">
            <input 
              class="border p-2 rounded" 
              placeholder="First Name" 
              [(ngModel)]="form.firstName" 
              name="firstName" 
              required 
            />
            <input 
              class="border p-2 rounded" 
              placeholder="Last Name" 
              [(ngModel)]="form.lastName" 
              name="lastName" 
              required 
            />
          </div>
          
          <!-- Account Information -->
          <input 
            class="border p-2 w-full rounded" 
            placeholder="Username" 
            [(ngModel)]="form.username" 
            name="username" 
            required 
          />
          
          <input 
            class="border p-2 w-full rounded" 
            type="email" 
            placeholder="Email" 
            [(ngModel)]="form.email" 
            name="email" 
            required 
          />
          
          <input 
            class="border p-2 w-full rounded" 
            type="password" 
            placeholder="Password (min 6 characters)" 
            [(ngModel)]="form.password" 
            name="password" 
            minlength="6" 
            required 
          />
          
          <!-- Organization -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Organization *</label>
            <select 
              class="border p-2 w-full rounded" 
              [(ngModel)]="form.organizationName" 
              name="organizationName"
              required
            >
              <option value="">Select an existing organization...</option>
              <option *ngFor="let org of organizations" [value]="org.name">{{ org.name }}</option>
            </select>
          </div>
          
          <!-- Role Selection -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Role *</label>
            <select 
              class="border p-2 w-full rounded" 
              [(ngModel)]="form.roleName" 
              name="roleName"
              required
            >
              <option value="VIEWER">Viewer (Default)</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          
          <!-- Submit -->
          <button 
            class="bg-blue-600 text-white py-2 px-4 rounded w-full hover:bg-blue-700 transition-colors"
            type="submit"
            [disabled]="isLoading"
          >
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
          
          <!-- Error message -->
          <div *ngIf="errorMessage" class="text-red-600 text-sm text-center">
            {{ errorMessage }}
          </div>
          
          <!-- Login link -->
          <div class="text-center text-sm">
            Already have an account? 
            <a href="/login" class="text-blue-600 hover:underline">Login here</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class RegisterPage implements OnInit {
  form = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    organizationName: '',
    roleName: 'VIEWER'
  };
  
  isLoading = false;
  errorMessage = '';
  organizations: any[] = [];

  constructor(
    private auth: AuthService, 
    private router: Router, 
    private http: HttpClient, 
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadOrganizations();
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



  register() {
    if (!this.form.firstName || !this.form.lastName || !this.form.username || !this.form.email || !this.form.password || !this.form.organizationName || !this.form.roleName) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const registerData = {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      username: this.form.username,
      email: this.form.email,
      password: this.form.password,
      organizationName: this.form.organizationName,
      roleName: this.form.roleName
    };

    this.auth.register(registerData).subscribe({
      next: () => {
        this.router.navigateByUrl('/login');
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}