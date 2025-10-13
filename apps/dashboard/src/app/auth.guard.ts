import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);
  const token = (typeof window !== 'undefined') ? window.localStorage.getItem('access_token') : null;
  return token ? true : router.parseUrl('/login');
};
