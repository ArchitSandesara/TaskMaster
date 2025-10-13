import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Use relative path; dev server proxies /api to the backend to avoid CORS issues.
  baseUrl = '/api';
}
