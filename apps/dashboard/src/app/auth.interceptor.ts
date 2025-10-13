import { HttpInterceptorFn } from '@angular/common/http';

function safeLocalStorage(): Storage | null {
  try { return typeof window !== 'undefined' && window?.localStorage ? window.localStorage : null; } catch { return null; }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const ls = safeLocalStorage();
  const token = ls?.getItem('access_token') ?? null;
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
