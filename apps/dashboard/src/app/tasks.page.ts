import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HttpClient } from '@angular/common/http';
import { TaskService } from './task.service';
import { decodeJwt } from './jwt.util';
import { OrganizationManagerComponent } from './organization-manager.component';
import { UserManagerComponent } from './user-manager.component';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { IAuditLog, AuditAction, ResourceType } from 'data';
// (moved inside class)
import { ThemeService } from './theme.service';
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, OrganizationManagerComponent, UserManagerComponent, NgApexchartsModule, RouterModule],
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss']
})
export class TasksPage implements OnInit {
  public resourceTypeEnum = ResourceType;
  tasks: any[] = [];
  users: any[] = [];
  categories: string[] = [];
  columns = [
    { label: 'To Do', status: 'To Do' },
    { label: 'In Progress', status: 'In Progress' },
    { label: 'Done', status: 'Done' }
  ];
  search = '';
  filterCategory = '';
  sort = 'dueDate';
  selectedSidebarOption = 'Tasks Dashboard';
  theme: 'light' | 'dark' = 'light';
  sidebarOpen = true;
  toggleTheme() {
    this.themeService.toggleTheme();
  }
  showModal = false;
  editTaskObj: any = null;
  form: any = { title: '', category: '', status: 'To Do', dueDate: '', description: '', priority: 'Medium', assignedTo: '' };
  newCategory = '';
  auditLog: any[] = [];

  // Audit Log Properties
  auditLogs: IAuditLog[] = [];
  filteredAuditLogs: IAuditLog[] = [];
  loading = false;
  
  // Filters
  filterUser = '';
  filterAction = '';
  filterResourceType = '';
  filterDateFrom = '';
  filterDateTo = '';
  
  // Sorting
  sortBy = 'timestamp';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Data for dropdowns
  uniqueUsers: string[] = [];
  auditActions = Object.values(AuditAction);
  resourceTypes = Object.values(ResourceType);
  
  // Utility references
  Math = Math;
  // Chart-related properties
  xAxisOptions = [
    { label: 'Category', value: 'category' },
    { label: 'Assigned to User', value: 'assignedTo' },
    { label: 'Status', value: 'status' },
    { label: 'Organization', value: 'organization' },
    { label: 'Priority', value: 'priority' }
  ];
  selectedXAxis = 'category';
  chartSeries: any = [];
  chartOptions: any = { chart: {}, xaxis: {}, plotOptions: {}, dataLabels: {}, title: {} };

  // Helper methods for template safety
  formatChangeValue(entry: { key: unknown; value: unknown }): string {
    if (!entry) return '';
    const k = String((entry as any).key);
    const v: any = (entry as any).value;
    if (k === 'dueDate') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? String(v ?? '') : d.toISOString().slice(0, 10);
    }
    return String(v ?? '');
  }

  hasPrevValue(log: any, entry: { key: unknown }): boolean {
    const k = String((entry as any)?.key);
    const prev = log?.metadata?.['previousValues'];
    return !!prev && Object.prototype.hasOwnProperty.call(prev, k);
  }

  prevValue(log: any, entry: { key: unknown }): any {
    const k = String((entry as any)?.key);
    const prev = log?.metadata?.['previousValues'];
    return prev ? prev[k] : '';
  }

  formatPrevValue(log: any, entry: { key: unknown }): string {
    const k = String((entry as any)?.key);
    const v = this.prevValue(log, entry);
    if (k === 'dueDate') {
      const d = new Date(v as any);
      return isNaN(d.getTime()) ? String(v ?? '') : d.toISOString().slice(0, 10);
    }
    return String(v ?? '');
  }

  formatNewValue(log: any, entry: { key: unknown; value?: unknown }): string {
    if (!entry) return '';
    const k = String((entry as any).key);
    let v: any = (entry as any).value;
    if (k === 'assignedTo') {
      const updatedName = log?.metadata?.['updatedTask']?.assignedTo;
      v = updatedName ?? v;
    }
    if (k === 'dueDate') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? String(v ?? '') : d.toISOString().slice(0, 10);
    }
    return String(v ?? '');
  }

  hasOldAndNewDifferent(log: any, entry: { key: unknown; value?: unknown }): boolean {
    if (!this.hasPrevValue(log, entry)) return false;
    return this.formatPrevValue(log, entry) !== this.formatNewValue(log, entry);
  }

  ngOnInit() {
    // Subscribe to theme changes
    this.theme = this.themeService.getCurrentTheme();
    this.themeService.theme$.subscribe(theme => {
      this.theme = theme;
      this.updateChart(); // Update chart when theme changes
    });
    
    this.reload();
    this.loadUsers();
    this.updateChart();
  }

  onSidebarOptionChange(option: string) {
    this.selectedSidebarOption = option;
    if (option === 'Audit Log (Admin View)') {
      this.loadAuditLogs();
    }
  }

  updateChart() {
    // Group tasks by selectedXAxis
    let groupKey = this.selectedXAxis;
    let groupMap = new Map<string, number>();
    for (const t of this.tasks) {
      let key = '';
      if (groupKey === 'category') {
        key = t.category || 'Uncategorized';
      } else if (groupKey === 'assignedTo') {
        key = t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned';
      } else if (groupKey === 'status') {
        key = t.status || 'Unknown';
      } else if (groupKey === 'organization') {
        key = t.organization?.name || 'Unknown';
      } else if (groupKey === 'priority') {
        key = t.priority || 'None';
      }
      groupMap.set(key, (groupMap.get(key) || 0) + 1);
    }
    const categories = Array.from(groupMap.keys());
    const counts = Array.from(groupMap.values());
    this.chartSeries = [{ name: 'Tasks', data: counts }];
    const isDark = this.theme === 'dark';
    this.chartOptions = {
      chart: { type: 'bar', height: 350, foreColor: isDark ? '#e5e7eb' : '#374151', background: 'transparent' },
      theme: { mode: isDark ? 'dark' : 'light' },
      plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
      dataLabels: { enabled: true, style: { colors: [isDark ? '#f3f4f6' : '#111827'] } },
      xaxis: { categories, labels: { style: { colors: isDark ? '#d1d5db' : '#4b5563' } } },
      yaxis: { labels: { style: { colors: isDark ? '#d1d5db' : '#4b5563' } } },
      grid: { borderColor: isDark ? '#374151' : '#e5e7eb' },
      legend: { labels: { colors: isDark ? '#e5e7eb' : '#374151' } },
      tooltip: { theme: isDark ? 'dark' : 'light' },
      colors: isDark ? ['#60a5fa'] : ['#3b82f6'],
      title: { text: `Tasks by ${this.xAxisOptions.find(x => x.value === groupKey)?.label || groupKey}`, style: { color: isDark ? '#f3f4f6' : '#111827' } },
      noData: { text: 'No data', align: 'center', style: { color: isDark ? '#9ca3af' : '#6b7280' } }
    };
  }
  constructor(
    public tasksApi: TaskService,
    public router: Router,
    public auth: AuthService,
    private http: HttpClient,
    private api: ApiService,
    private themeService: ThemeService
  ) {}

  reload() {
    this.tasksApi.list().subscribe((res: any[]) => {
      this.tasks = res;
      this.categories = Array.from(new Set(res.map(t => t.category).filter(Boolean)));
      this.updateChart();
    });
  }

  loadUsers() {
    this.tasksApi.getUsers().subscribe((res: any[]) => {
      this.users = res;
    });
  }

  get userId(): string {
    const token = localStorage.getItem('access_token');
    const payload = decodeJwt(token || '');
    return payload?.sub || '—';
  }
  get userName(): string {
    const token = localStorage.getItem('access_token');
    const payload = decodeJwt(token || '');
    return payload?.firstName ? `${payload.firstName} ${payload.lastName}` : payload?.email || '[User]';
  }
  get userRole(): string {
    const token = localStorage.getItem('access_token');
    const payload = decodeJwt(token || '');
    return payload?.roleName || payload?.role || '—';
  }
  get organizationName(): string {
    const token = localStorage.getItem('access_token');
    const payload = decodeJwt(token || '');
    return payload?.organizationName || 'My Organization';
  }
  get canEdit() {
    return ['Owner', 'Admin'].includes(this.userRole);
  }
  get canManageOrganizations() {
    return ['Admin'].includes(this.userRole);
  }
  get canManageUsers() {
    return ['Admin'].includes(this.userRole);
  }
  // Visualization: visible to Admin and Owner
  get canSeeVisualization() {
    return ['Admin', 'Owner'].includes(this.userRole);
  }
  // Audit log: Admin only
  get canSeeAuditLog() {
    return ['Admin'].includes(this.userRole);
  }

  // Return classes for sidebar menu items, including active highlight
  getMenuItemClasses(name: string) {
    const isActive = this.selectedSidebarOption === name;
    const base = 'rounded px-3 py-2 flex items-center gap-2';
    const activeLight = 'bg-blue-600 text-white';
    const activeDark = 'bg-blue-500 text-white';
    const idleLight = 'hover:bg-gray-200 text-black';
    const idleDark = 'hover:bg-gray-800 text-white';
    if (isActive) {
      return this.theme === 'dark' ? `${base} ${activeDark}` : `${base} ${activeLight}`;
    }
    return this.theme === 'dark' ? `${base} ${idleDark}` : `${base} ${idleLight}`;
  }
  get tasksByStatus() {
    let filtered = this.tasks;
    if (this.search) filtered = filtered.filter(t => t.title?.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterCategory) filtered = filtered.filter(t => t.category === this.filterCategory);
    filtered = [...filtered].sort((a, b) => {
      if (this.sort === 'dueDate') return (a.dueDate || '').localeCompare(b.dueDate || '');
      if (this.sort === 'title') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });
    return this.columns.reduce((acc, col) => {
      acc[col.status] = filtered.filter(t => t.status === col.status);
      return acc;
    }, {} as Record<string, any[]>);
  }
  addCategory() {
    if (this.newCategory && !this.categories.includes(this.newCategory)) {
      this.categories.push(this.newCategory);
      this.form.category = this.newCategory;
    }
    this.newCategory = '';
  }
  closeModal() {
    this.showModal = false;
    this.editTaskObj = null;
    this.form = { title: '', category: '', status: 'To Do', dueDate: '', description: '', priority: 'Medium', assignedTo: '' };
    this.newCategory = '';
  }
  saveTask() {
    if (!this.form.title || !this.form.status || !this.form.dueDate) return;
    const payload = { ...this.form };
    if (payload.dueDate && typeof payload.dueDate === 'string' && !payload.dueDate.includes('T')) {
      payload.dueDate = new Date(payload.dueDate).toISOString();
    }
    // Ensure assignedTo is a string if present
    if (payload.assignedTo !== undefined && payload.assignedTo !== null && payload.assignedTo !== '') {
      payload.assignedTo = String(payload.assignedTo);
    }
    const op = this.editTaskObj ? this.tasksApi.update(this.editTaskObj.id, payload) : this.tasksApi.create(payload);
    op.subscribe({
      next: (saved: any) => {
        // Optimistically update local list so the UI refreshes immediately
        if (this.editTaskObj) {
          this.tasks = this.tasks.map(t => (t.id === saved.id ? saved : t));
        } else {
          this.tasks = [saved, ...this.tasks];
        }
        // Recompute categories in case a new category was added/edited
        this.categories = Array.from(new Set(this.tasks.map(t => t.category).filter(Boolean)));
        this.closeModal();
        // Refresh audit log after save
        this.loadAuditLogs();
      },
      error: () => {
        // Fallback: close and hard reload the list if something went wrong
        this.closeModal();
        this.reload();
        // Also refresh audit log in case of error
        this.loadAuditLogs();
      },
    });
  }
  editTask(t: any) {
    this.editTaskObj = t;
    // Format dueDate for input type="date"
    let dueDate = '';
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      dueDate = d.toISOString().slice(0, 10);
    }
    // Set assignedTo as id or email (adjust as needed)
    let assignedTo = '';
    if (t.assignedTo) {
      assignedTo = t.assignedTo.id || t.assignedTo.email || t.assignedTo;
    }
    this.form = {
      title: t.title || '',
      category: t.category || '',
      status: t.status || 'To Do',
      dueDate,
      description: t.description || '',
      priority: t.priority || 'Medium',
      assignedTo
    };
    this.showModal = true;
  }
  deleteTask(t: any) {
    if (confirm('Delete this task?')) this.tasksApi.remove(t.id).subscribe(() => this.reload());
  }
  logout() {
    localStorage.removeItem('access_token');
    this.router.navigateByUrl('/login');
  }

  // Audit Log Methods
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
    this.uniqueUsers = [...new Set(this.auditLogs.map(log => log.userEmail))].sort();
  }

  applyFiltersAndSort() {
    let filtered = [...this.auditLogs];

    // Apply filters
    if (this.filterUser) {
      filtered = filtered.filter(log => log.userEmail.includes(this.filterUser));
    }
    if (this.filterAction) {
      filtered = filtered.filter(log => log.action === this.filterAction);
    }
    if (this.filterResourceType) {
      filtered = filtered.filter(log => log.resourceType === this.filterResourceType);
    }
    if (this.filterDateFrom) {
      const fromDate = new Date(this.filterDateFrom);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }
    if (this.filterDateTo) {
      const toDate = new Date(this.filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch(this.sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'userEmail':
          aValue = a.userEmail;
          bValue = b.userEmail;
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
          break;
        case 'resourceType':
          aValue = a.resourceType;
          bValue = b.resourceType;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredAuditLogs = filtered;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredAuditLogs.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  getPaginatedLogs(): IAuditLog[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAuditLogs.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  clearFilters() {
    this.filterUser = '';
    this.filterAction = '';
    this.filterResourceType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.applyFiltersAndSort();
  }

  sortAuditLog(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.applyFiltersAndSort();
  }

  formatDate(timestamp: string | Date): string {
    return new Date(timestamp).toLocaleDateString();
  }

  formatTime(timestamp: string | Date): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-purple-100 text-purple-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      case 'VIEW': return 'bg-cyan-100 text-cyan-800';
      case 'ENABLE': return 'bg-emerald-100 text-emerald-800';
      case 'DISABLE': return 'bg-orange-100 text-orange-800';
      case 'ASSIGN': return 'bg-indigo-100 text-indigo-800';
      case 'UNASSIGN': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
