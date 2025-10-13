import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient, private api: ApiService) {}

  list() { return this.http.get<any[]>(`${this.api.baseUrl}/tasks`); }
  create(input: any) { return this.http.post(`${this.api.baseUrl}/tasks`, input); }
  update(id: string, input: any) { return this.http.put(`${this.api.baseUrl}/tasks/${id}`, input); }
  remove(id: string) { return this.http.delete(`${this.api.baseUrl}/tasks/${id}`); }
  // Get active users in the current organization (provided by API: GET /api/tasks/users)
  getUsers(): Observable<any[]> { return this.http.get<any[]>(`${this.api.baseUrl}/tasks/users`); }
}
