import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <!-- Theme Toggle Button -->
    <button 
      type="button" 
      (click)="toggleTheme()" 
      class="fixed top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200"
      title="Toggle theme">
      <span class="text-xl">{{theme === 'dark' ? '☀️' : '🌙'}}</span>
    </button>
    
    <form class="bg-white dark:bg-gray-800 p-8 rounded shadow w-96 space-y-4" (ngSubmit)="login()">
      <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white">TaskMaster</h1>
      <input class="border border-gray-300 dark:border-gray-600 p-2 w-full rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" placeholder="Email" [(ngModel)]="email" name="email" />
      <input class="border border-gray-300 dark:border-gray-600 p-2 w-full rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" type="password" placeholder="Password" [(ngModel)]="password" name="password" />
      <button class="bg-blue-600 text-white py-2 px-4 rounded w-full hover:bg-blue-700 transition-colors">Log in</button>
      <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
        Demo accounts: owner@example.com, admin@example.com, viewer@example.com (password: password)
      </div>
    </form>
  </div>
  `,
})
export class LoginPage {
  email = 'owner@example.com';
  password = 'password';
  theme: 'light' | 'dark' = 'light';
  
  constructor(private auth: AuthService, private router: Router, private themeService: ThemeService) {
    // Subscribe to theme changes and apply theme
    this.theme = this.themeService.getCurrentTheme();
    this.themeService.theme$.subscribe(theme => {
      this.theme = theme;
    });
    
    // Redirect to /tasks if already logged in
    if (localStorage.getItem('access_token')) {
      this.router.navigateByUrl('/tasks');
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
  login() {
    this.auth.login(this.email, this.password).subscribe(() => this.router.navigateByUrl('/tasks'));
  }
}
