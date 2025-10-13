import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { AuditAction, ResourceType, IAuditLog, Permission } from 'data';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./audit-log.page.scss'],
  template: `
    <div class="audit-log-container" 
         [class.dark]="isDarkMode" 
         [class.light]="!isDarkMode">
      <div class="header-section">
        <h1 class="page-title">📋 Audit Log</h1>
        <p class="page-description">Track all system activities and user actions</p>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label for="userFilter">Filter by User:</label>
          <select id="userFilter" 
                  [(ngModel)]="selectedUserId" 
                  (change)="onFilterChange()"
                  class="filter-select">
            <option value="">All Users</option>
            <option *ngFor="let user of uniqueUsers" [value]="user.userId">
              {{user.userName}} ({{user.userEmail}})
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="actionFilter">Filter by Action:</label>
          <select id="actionFilter" 
                  [(ngModel)]="selectedAction" 
                  (change)="onFilterChange()"
                  class="filter-select">
            <option value="">All Actions</option>
            <option *ngFor="let action of auditActions" [value]="action">
              {{getActionDisplay(action)}}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="resourceFilter">Filter by Resource:</label>
          <select id="resourceFilter" 
                  [(ngModel)]="selectedResourceType" 
                  (change)="onFilterChange()"
                  class="filter-select">
            <option value="">All Resources</option>
            <option *ngFor="let resource of resourceTypes" [value]="resource">
              {{resource}}
            </option>
          </select>
        </div>

        <button (click)="clearFilters()" class="clear-filters-btn">
          Clear Filters
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <p>Loading audit logs...</p>
      </div>

      <!-- Audit Log Table -->
      <div *ngIf="!loading" class="audit-log-table-container">
        <div class="stats-summary">
          <span class="stat-item">
            <strong>Total Entries:</strong> {{filteredLogs.length}}
          </span>
          <span class="stat-item">
            <strong>Time Range:</strong> 
            <span *ngIf="filteredLogs.length > 0">
              {{getOldestTimestamp()}} - {{getNewestTimestamp()}}
            </span>
            <span *ngIf="filteredLogs.length === 0">N/A</span>
          </span>
        </div>

        <div class="table-wrapper">
          <table class="audit-table">
            <thead>
              <tr>
                <th (click)="sortBy('timestamp')" class="sortable">
                  Timestamp 
                  <span class="sort-indicator" *ngIf="sortField === 'timestamp'">
                    {{sortDirection === 'asc' ? '↑' : '↓'}}
                  </span>
                </th>
                <th (click)="sortBy('userName')" class="sortable">
                  User 
                  <span class="sort-indicator" *ngIf="sortField === 'userName'">
                    {{sortDirection === 'asc' ? '↑' : '↓'}}
                  </span>
                </th>
                <th (click)="sortBy('action')" class="sortable">
                  Action 
                  <span class="sort-indicator" *ngIf="sortField === 'action'">
                    {{sortDirection === 'asc' ? '↑' : '↓'}}
                  </span>
                </th>
                <th (click)="sortBy('resourceType')" class="sortable">
                  Resource 
                  <span class="sort-indicator" *ngIf="sortField === 'resourceType'">
                    {{sortDirection === 'asc' ? '↑' : '↓'}}
                  </span>
                </th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of paginatedLogs" class="audit-row" [attr.data-action]="log.action">
                <td class="timestamp-cell">
                  <div class="timestamp-primary">{{formatDate(log.timestamp)}}</div>
                  <div class="timestamp-secondary">{{formatTime(log.timestamp)}}</div>
                </td>
                <td class="user-cell">
                  <div class="user-primary">{{log.userName}}</div>
                  <div class="user-secondary">{{log.userEmail}}</div>
                </td>
                <td class="action-cell">
                  <span class="action-badge" [attr.data-action]="log.action">
                    {{getActionDisplay(log.action)}}
                  </span>
                </td>
                <td class="resource-cell">
                  <div class="resource-primary">{{log.resourceType}}</div>
                  <div class="resource-secondary" *ngIf="log.resourceName">
                    {{log.resourceName}}
                  </div>
                </td>
                <td class="details-cell">
                  <div class="details-content">
                    <div *ngIf="log.organizationName" class="detail-item">
                      <strong>Organization:</strong> {{log.organizationName}}
                    </div>
                    <div *ngIf="log.metadata" class="detail-item">
                      <strong>Metadata:</strong>
                      <div class="metadata-content">
                        <div *ngFor="let item of getMetadataEntries(log.metadata)" class="metadata-item">
                          <span class="metadata-key">{{item.key}}:</span>
                          <span class="metadata-value">{{item.value}}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="ip-cell">
                  <div class="ip-address">{{log.ipAddress || 'N/A'}}</div>
                  <div class="user-agent" [title]="log.userAgent">
                    {{getUserAgentShort(log.userAgent)}}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-container" *ngIf="filteredLogs.length > pageSize">
          <div class="pagination-info">
            Showing {{getPaginationStart()}} - {{getPaginationEnd()}} of {{filteredLogs.length}} entries
          </div>
          <div class="pagination-controls">
            <button (click)="goToPage(currentPage - 1)" 
                    [disabled]="currentPage <= 1" 
                    class="page-btn">
              Previous
            </button>
            <span class="page-info">
              Page {{currentPage}} of {{getTotalPages()}}
            </span>
            <button (click)="goToPage(currentPage + 1)" 
                    [disabled]="currentPage >= getTotalPages()" 
                    class="page-btn">
              Next
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredLogs.length === 0" class="empty-state">
          <p>No audit log entries found.</p>
          <p *ngIf="hasActiveFilters()">Try adjusting your filters to see more results.</p>
        </div>
      </div>
    </div>
  `
})
export class AuditLogPageComponent implements OnInit, OnDestroy {
  auditLogs: IAuditLog[] = [];
  filteredLogs: IAuditLog[] = [];
  paginatedLogs: IAuditLog[] = [];
  loading = true;
  isDarkMode = false;

  // Filter properties
  selectedUserId = '';
  selectedAction = '';
  selectedResourceType = '';
  uniqueUsers: Array<{userId: string, userName: string, userEmail: string}> = [];
  auditActions = Object.values(AuditAction);
  resourceTypes = Object.values(ResourceType);

  // Sorting properties
  sortField = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination properties
  currentPage = 1;
  pageSize = 20;

  private subscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadAuditLogs();
    
    // Check for dark mode from localStorage or system preference
    this.isDarkMode = localStorage.getItem('theme') === 'dark' || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAuditLogs() {
    this.loading = true;
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    this.http.get<IAuditLog[]>(`${this.api.baseUrl}/audit-log`, { headers })
      .subscribe({
        next: (logs) => {
          this.auditLogs = logs;
          this.extractUniqueUsers();
          this.applyFiltersAndSort();
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load audit logs:', error);
          this.loading = false;
        }
      });
  }

  extractUniqueUsers() {
    const userMap = new Map();
    this.auditLogs.forEach(log => {
      if (!userMap.has(log.userId)) {
        userMap.set(log.userId, {
          userId: log.userId,
          userName: log.userName,
          userEmail: log.userEmail
        });
      }
    });
    this.uniqueUsers = Array.from(userMap.values())
      .sort((a, b) => a.userName.localeCompare(b.userName));
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  clearFilters() {
    this.selectedUserId = '';
    this.selectedAction = '';
    this.selectedResourceType = '';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    // Apply filters
    this.filteredLogs = this.auditLogs.filter(log => {
      if (this.selectedUserId && log.userId !== this.selectedUserId) return false;
      if (this.selectedAction && log.action !== this.selectedAction) return false;
      if (this.selectedResourceType && log.resourceType !== this.selectedResourceType) return false;
      return true;
    });

    // Apply sorting
    this.filteredLogs.sort((a, b) => {
      let aValue: any = a[this.sortField as keyof IAuditLog];
      let bValue: any = b[this.sortField as keyof IAuditLog];

      if (this.sortField === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLogs = this.filteredLogs.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }

  getPaginationStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredLogs.length);
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedUserId || this.selectedAction || this.selectedResourceType);
  }

  getActionDisplay(action: string): string {
    const actionMap: { [key: string]: string } = {
      CREATE: 'Create',
      READ: 'Read',
      UPDATE: 'Update',
      DELETE: 'Delete',
      LOGIN: 'Login',
      LOGOUT: 'Logout',
      ENABLE: 'Enable',
      DISABLE: 'Disable',
      ASSIGN: 'Assign',
      UNASSIGN: 'Unassign'
    };
    return actionMap[action] || action;
  }

  formatDate(timestamp: string | Date): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getNewestTimestamp(): string {
    if (this.filteredLogs.length === 0) return '';
    const newest = this.filteredLogs.reduce((latest, log) => 
      new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
    );
    return this.formatDate(newest.timestamp);
  }

  getOldestTimestamp(): string {
    if (this.filteredLogs.length === 0) return '';
    const oldest = this.filteredLogs.reduce((earliest, log) => 
      new Date(log.timestamp) < new Date(earliest.timestamp) ? log : earliest
    );
    return this.formatDate(oldest.timestamp);
  }

  getMetadataEntries(metadata: Record<string, any> | undefined): Array<{key: string, value: string}> {
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));
  }

  getUserAgentShort(userAgent?: string): string {
    if (!userAgent) return 'N/A';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  }
}