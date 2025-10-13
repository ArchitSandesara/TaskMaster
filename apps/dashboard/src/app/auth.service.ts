import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private api: ApiService) {}

  login(email: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.api.baseUrl}/auth/login`, { email, password }).pipe(
      tap((res) => localStorage.setItem('access_token', res.access_token))
    );
  }

  register(data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    organizationName: string;
    roleName: string;
  }): Observable<{ id: string; email: string }> {
    return this.http.post<{ id: string; email: string }>(`${this.api.baseUrl}/auth/register`, data);
  }
}
