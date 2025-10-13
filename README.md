# TaskMaster (NX Monorepo)

Full-stack secure task management system with NestJS API, Angular dashboard, and shared RBAC/data libraries.

## Technologies Used
- **Generative AI**: AI coding assistant (Github Copilot).
- **Nx Monorepo**: Manages multiple apps and libraries in a single codebase
- **NestJS**: Backend framework (Node.js, TypeScript)
- **TypeORM**: ORM for database access (SQLite by default)
- **Angular**: Frontend SPA framework (TypeScript)
- **Tailwind CSS**: Utility-first CSS for UI styling
- **JWT**: Authentication (JSON Web Tokens)
- **RBAC**: Role-Based Access Control (custom, shared in `libs/auth`)
- **SQLite**: Default database (file-based, easy local setup)
- **Jest**: Unit and integration testing
- **Playwright**: E2E testing (dashboard-e2e)

## Structure
- apps/
  - api/ – NestJS backend (TypeORM + JWT + RBAC)
  - dashboard/ – Angular frontend (Tailwind)
- libs/
  - data/ – Shared TS interfaces and DTOs
  - auth/ – Reusable RBAC utilities, decorators, JWT guard/strategy

## Code Structure Overview

```
task-master/
├── apps/
│   ├── api/         # NestJS backend (controllers, services, entities)
│   ├── dashboard/   # Angular frontend (components, pages, services)
│   ├── api-e2e/     # API end-to-end tests (Jest)
│   └── dashboard-e2e/ # Dashboard E2E tests (Playwright)
├── libs/
│   ├── data/        # Shared TypeScript interfaces, DTOs
│   └── auth/        # Shared RBAC logic, guards, decorators
├── nx.json, package.json, etc. # Nx and project configs
```

### Data Flow: Frontend ⇄ Backend ⇄ Database

1. **Frontend (Angular Dashboard)**
  - User interacts with UI (e.g., creates/updates a task)
  - Angular service sends HTTP request to API (via proxy, e.g., `/api/tasks`)

2. **Backend (NestJS API)**
  - Controller receives request, validates JWT, checks permissions (RBAC)
  - Service layer processes business logic (e.g., creates/updates entity)
  - TypeORM persists/fetches data from SQLite database
  - For actions, audit log entries are created (who, what, when, details)
  - API responds with result (DTOs from `libs/data`)

3. **Database (SQLite)**
  - Stores users, organizations, roles, tasks, audit logs, etc.

4. **Reverse Flow (DB → API → Frontend)**
  - API fetches data (e.g., tasks, audit logs) from DB
  - Returns to frontend as JSON
  - Angular renders data in UI tables, forms, etc.

**Example:**
- User updates a task in the dashboard → Angular sends PUT `/api/tasks/:id` with changes → API validates, updates DB, logs action in audit log → API returns updated task → UI updates table and audit log view.

## Prereqs
- Node 18+
- pnpm or npm (repo uses npm in scripts)

## Setup
1. Install deps
   npm install

2. Run API (SQLite DB file created in repo root)
   npx nx serve api --port=3001
   - JWT secret: set JWT_SECRET env optionally; default is 'changeme'
   - Global prefix: /api

3. Run Dashboard
   npx nx serve dashboard --port=4200

4. First user
   - POST /api/auth/register with email/password to create user+org+role
   - Then POST /api/auth/login to obtain a JWT

5. Use UI
   - Visit http://localhost:4200
   - Login and manage tasks at /tasks

## API Overview
- Auth
  - POST /api/auth/register – create user
  - POST /api/auth/login – JWT login
- Tasks
  - POST /api/tasks – create (permission: create_task)
  - GET /api/tasks – list by organization (permission: read_task)
  - PUT /api/tasks/:id – update (permission: update_task)
  - DELETE /api/tasks/:id – delete (permission: delete_task)
- Audit Log
  - GET /api/audit-log – Owner/Admin only

## Application Functionality

### 1. Login
- Users access the application at `http://localhost:4200`.
- They are presented with a login screen to enter their email and password.
- Upon successful login, they are redirected to the main dashboard.

### 2. Left Menu & Role-Based Functionality
The options visible in the left-hand menu and the available actions depend on the user's role (`Owner`, `Admin`, or `Viewer`).

| Menu Item       | Visible to          | Functionality                                                                                                                            |
| --------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Tasks**       | `Owner`, `Admin`, `Viewer` | - **Owner/Admin**: Can create, view, update, and delete tasks within their organization. <br> - **Viewer**: Can only view tasks.          |
| **Organizations** | `Admin` | - View a list of all organizations. <br> - Enable or disable any organization.                                                           |
| **Users**         |`Admin`| - View a list of all users in the system.                                                                                                |
| **Audit Log**     | `Admin` | - View a detailed, filterable log of all actions performed by all users, including creation, updates, deletions, and login/logout events. |

## Access Control
- Role hierarchy and default permissions defined in libs/auth
- PermissionsGuard enforces required permissions via @Permissions(...)
- JwtAuthGuard protects endpoints using bearer tokens
- Task visibility scoped by organization

## Seeded Accounts
On first API start, a seed runs automatically if there are no users yet. It creates:
- owner@example.com / password (Owner)
- admin@example.com / password (Admin)
- viewer@example.com / password (Viewer)

All three are placed in the same organization: "Archit.Org". Use these for quick login in the dashboard UI.

To force re-seeding (wipe orgs/roles/users/tasks and reseed the baseline above), you can run the API with:
