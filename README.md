# NOVA — Team Productivity Platform
> **Plan. Collaborate. Deliver.**

[![Full Stack Application](https://img.shields.io/badge/Full_Stack-Production_Ready-teal.svg)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.18-1b222d.svg)](https://prisma.io)

NOVA is a full-stack, enterprise-grade project management and team productivity web application built for engineering and product teams. It unites workspace management, drag-and-drop Kanban workflows, subtask checklists, team discussions, velocity tracking, and workload analytics into a single cohesive experience.

> 📖 **Deep Dive Documentation**: For the complete, end-to-end technical explanation, database schemas, WebSocket event dictionary, and deployment guides, see **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)**.

---

## 🌟 Key Features

### 1. 🗂️ Multi-Project Workspace
- Create and organize projects with custom project keys (e.g. `NOVA`, `MOB`, `INFRA`), status tracking, and priority badges.
- Real-time project progress calculation (% completion) dynamically driven by underlying tasks.
- Target due dates, member roster previews, and health indicators.

### 2. 📋 Interactive Kanban Board (Drag-and-Drop)
- Fluid drag-and-drop between **To Do**, **In Progress**, **In Review**, and **Done** pipelines powered by `@hello-pangea/dnd`.
- Optimistic UI updates with instant state persistence to the backend API.
- Confetti celebration animation when tasks reach the "Done" state.
- Column task count badges and quick inline task creation.

### 3. 📑 High-Density List / Table View
- Linear-inspired spreadsheet list view with column sorting (by key, priority, due date).
- Multi-state filtering by status, search queries, and assignees.
- Inline status and priority pickers for instantaneous updates without modal switching.

### 4. 🔍 Comprehensive Task Modal & Collaboration
- Rich task description editor and priority/status management.
- **Subtasks Checklist**: Add subtasks, toggle completion checkboxes, delete items, and watch live progress bars update.
- **Discussions Stream**: Add timestamped comments with author avatars and titles.
- **Audit Activity Log**: Historical timeline logging who created, updated, or moved the task.

### 5. 📊 Real-Time Analytics & Productivity Telemetry
- Sprint velocity metrics and burndown completion rates.
- Interactive **Recharts** visualizations:
  - Task Volume by Pipeline Stage (Bar Chart)
  - Risk & Priority Distribution (Donut Chart)
  - Engineer Workload Distribution (Done vs Pending tasks per team member)
- Live team activity audit feed.

### 6. 🔐 Complete Authentication & 1-Click Evaluation
- Secure JWT/Cookie session authentication with bcrypt password hashing.
- Role-based access control (`ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`).
- **1-Click Recruiter/Demo Access** on the login page:
  - **Admin**: Alex Rivera (`alex.rivera@nova.app`)
  - **Product Manager**: Sarah Chen (`sarah.chen@nova.app`)
  - **Full Stack Engineer**: David Kim (`david.kim@nova.app`)

---

## 🛠️ Complete Application Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript | High-performance server and client rendering |
| **Styling** | Tailwind CSS, Lucide React Icons | Sleek dark/light theme, modern UI tokens |
| **Interactivity** | `@hello-pangea/dnd`, `canvas-confetti` | Accessible drag-and-drop & celebratory micro-interactions |
| **Analytics** | Recharts | Velocity charts, workload bars, priority donuts |
| **Backend & API** | Next.js API Route Handlers (`/api/*`) | RESTful API endpoints with structured JSON responses |
| **Validation** | Zod | Runtime schema validation for requests and payloads |
| **Database & ORM**| Prisma ORM with SQLite (PostgreSQL compatible) | Type-safe data access, relations, and migrations |
| **Authentication**| Jose / JWT + BcryptJS | Secure HTTP-only cookies and Bearer tokens |
| **DevOps** | Docker, Docker Compose | Production-grade containerization and one-command run |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js 18+ or 20+
- npm (v9+)

### Installation Steps

1. **Clone or Navigate to the directory:**
   ```bash
   cd Nova_Assignment
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize Database & Seed Demo Data:**
   ```bash
   npx prisma db push
   npm run seed
   ```
   *This automatically generates `dev.db` and seeds 5 team members, 3 active projects, and 20+ realistic tasks, subtasks, comments, and activity logs.*

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open **http://localhost:3000** in your browser.

---

## 🔑 Demo Accounts (Pre-Seeded)

You can sign in with any of the following accounts or use the **"1-Click Recruiter Access"** buttons directly on the `/login` page:

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin (Lead)** | Alex Rivera | `alex.rivera@nova.app` | `nova123456` |
| **Product Manager** | Sarah Chen | `sarah.chen@nova.app` | `nova123456` |
| **Full Stack Engineer**| David Kim | `david.kim@nova.app` | `nova123456` |
| **Product Designer** | Elena Rostova | `elena.rostova@nova.app` | `nova123456` |
| **DevOps Architect** | Marcus Brody | `marcus.brody@nova.app` | `nova123456` |

---

## 🐳 Docker Deployment

To build and run the production container locally:

```bash
docker compose up --build -d
```
The app will be accessible at **http://localhost:3000**.

---

## 📡 API Reference Overview

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Sign in with credentials
- `POST /api/auth/demo-login` — 1-click login for evaluation
- `GET /api/auth/me` — Get current logged-in user profile
- `POST /api/auth/logout` — Invalidate session cookie

### Projects
- `GET /api/projects` — List all projects with progress stats
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Get project details, members, and tasks
- `PATCH /api/projects/:id` — Update project metadata
- `DELETE /api/projects/:id` — Delete project

### Tasks
- `GET /api/tasks` — Filter tasks by `projectId`, `status`, `priority`, `search`
- `POST /api/tasks` — Create task with automatic task numbering
- `GET /api/tasks/:id` — Get full task with subtasks, comments, and audit logs
- `PATCH /api/tasks/:id` — Update status, priority, order, assignee, due date
- `DELETE /api/tasks/:id` — Delete task

### Subtasks & Comments
- `POST /api/tasks/:id/subtasks` — Add subtask checklist item
- `PATCH /api/subtasks/:id` — Toggle checklist completion
- `DELETE /api/subtasks/:id` — Remove subtask
- `GET /api/tasks/:id/comments` — Fetch task discussion thread
- `POST /api/tasks/:id/comments` — Post comment on task

### Analytics & Team
- `GET /api/analytics` — Fetch team velocity, workload distribution, and status charts
- `GET /api/team` — List team roster
- `POST /api/team` — Invite new team member
