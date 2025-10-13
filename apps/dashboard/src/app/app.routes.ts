import { Route } from '@angular/router';
import { LoginPage } from './login.page';
import { RegisterPage } from './register.page';
import { TasksPage } from './tasks.page';
import { AuditLogPageComponent } from './audit-log.page';
import { authGuard } from './auth.guard';

export const appRoutes: Route[] = [
	{ path: '', pathMatch: 'full', redirectTo: 'tasks' },
	{ path: 'login', component: LoginPage },
	{ path: 'register', component: RegisterPage },
	{ path: 'tasks', component: TasksPage, canActivate: [authGuard] },
	{ path: 'audit-log', component: AuditLogPageComponent, canActivate: [authGuard] },
];
