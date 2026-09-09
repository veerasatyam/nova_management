# NOVA — Team Productivity Platform
## End-to-End System Architecture & Project Documentation

> **"Plan. Collaborate. Deliver."**  
> A production-grade, full-stack enterprise project management and real-time team productivity platform built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **MongoDB Atlas**, **Prisma ORM**, and **Socket.io**.

---

## 📑 Table of Contents
1. [Project Overview & Philosophy](#1-project-overview--philosophy)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Design & MongoDB Atlas Schema](#4-database-design--mongodb-atlas-schema)
5. [Real-Time WebSocket Architecture](#5-real-time-websocket-architecture)
6. [Security & Authentication Layer](#6-security--authentication-layer)
7. [Comprehensive REST API Reference](#7-comprehensive-rest-api-reference)
8. [Frontend Design & Component Hierarchy](#8-frontend-design--component-hierarchy)
9. [Verification, Testing & Hardening History](#9-verification-testing--hardening-history)
10. [Deployment & DevOps Runbook](#10-deployment--devops-runbook)

---

## 1. Project Overview & Philosophy

**NOVA** is built to bridge the gap between high-velocity engineering sprint execution and executive-level visibility. Modeled after modern tools like Linear, Jira, and Monday.com, NOVA unites:

- **Multi-Workspace Organization**: Hierarchical Project $\rightarrow$ Task $\rightarrow$ Subtask organization with custom issue identifiers (e.g. `NOVA-1`, `NOVA-2`).
- **Interactive Drag-and-Drop Kanban**: Real-time state machine for tasks moving across `TODO`, `IN_PROGRESS`, `IN_REVIEW`, and `DONE` pipelines.
- **Bi-directional Live Synchronization**: Real-time updates delivered to all connected team members via WebSockets.
- **Deep Collaboration**: Subtask progress tracking, rich timestamped discussions, and audit logs.
- **Engineering Velocity Telemetry**: Live Recharts dashboards displaying stage bottlenecks, risk distributions, and individual engineer workloads.
- **Enterprise Security**: Route protection middleware, JWT authentication with HTTP-only cookies, and defense against BOLA (Broken Object Level Authorization) and Privilege Escalation.

---

## 2. High-Level System Architecture

The following diagram illustrates how incoming traffic traverses Edge middleware, the unified HTTP/WebSocket server, the API handlers, and the MongoDB Atlas cloud database:

```mermaid
flowchart TD
    Client["Browser / Client (React 18 + Tailwind)"] -->|"HTTPS / WSS"| Edge["Next.js Edge Middleware (src/middleware.ts)"]
    
    subgraph AppServer["Unified Node.js Runtime (server.js)"]
        Edge -->|"Valid Token / Public"| HTTPRouter["Next.js 14 App Router"]
        HTTPRouter --> Pages["React Server & Client Pages\n(/dashboard, /projects, /analytics, /team)"]
        HTTPRouter --> APIRoutes["REST API Endpoints\n(/api/auth, /api/tasks, /api/projects)"]
        
        Client <-->|"Socket.io (WSS + Handshake Auth)"| SocketServer["Socket.io Engine\n(Rooms, Broadcasts, Presence)"]
    end

    subgraph DataLayer["Data & Persistence"]
        APIRoutes -->|"Prisma ORM Client"| MongoDB[("MongoDB Atlas Cloud Cluster\n(Database: nova)")]
        SocketServer -.->|"Read Active Users / Presence"| MemoryCache[("In-Memory Presence State")]
    end
```

---

## 3. Technology Stack

| Layer | Technologies | Key Responsibilities |
|---|---|---|
| **Frontend Framework** | **Next.js 14 (App Router)**, React 18, TypeScript 5.5 | Server-side rendering (SSR), client interactivity, routing, layout nesting. |
| **Styling & Icons** | **Tailwind CSS**, Lucide React, clsx, tailwind-merge | Modern dark/light theme, accessible micro-interactions, responsive flex/grid layouts. |
| **Kanban Engine** | **`@hello-pangea/dnd`** | Accessible HTML5 drag-and-drop with optimistic reordering and drop animations. |
| **Data Visualization** | **Recharts 2.12** | Responsive SVG charts (Donut risk charts, Bar stage volumes, Workload distributions). |
| **Micro-Interactions** | **`canvas-confetti`** | Celebration confetti bursts on task completion. |
| **Real-Time Engine** | **Socket.io 4.8** (Server & Client) | Persistent bi-directional event transport, project room isolation, online presence counting. |
| **Backend API** | **Next.js Route Handlers (`src/app/api/*`)** | RESTful endpoints returning standardized JSON responses. |
| **Database & ORM** | **MongoDB Atlas**, **Prisma ORM 5.18+** | Document database with schema enforcement, automatic ObjectId handling, and composite indices. |
| **Authentication** | **Jose 5.6**, **JSON Web Tokens (JWT)**, **BcryptJS** | Cryptographic token verification on Edge and Node, salted password hashing, HTTP-only cookies. |
| **DevOps & Containers**| **Docker**, **Node 20 Slim**, **Railway** | Multi-stage container build, automated dependency scanning, dynamic PORT binding. |

---

## 4. Database Design & MongoDB Atlas Schema

NOVA uses MongoDB Atlas with Prisma ORM. Models use native MongoDB `@db.ObjectId` mappings and composite indexes for high-concurrency read/write operations.

### Entity Relationship Model

```mermaid
erDiagram
    User ||--o{ ProjectMember : "participates in"
    User ||--o{ Project : "owns"
    User ||--o{ Task : "creates"
    User ||--o{ Task : "assigned to"
    User ||--o{ Comment : "writes"
    User ||--o{ ActivityLog : "triggers"

    Project ||--o{ ProjectMember : "contains"
    Project ||--o{ Task : "has"

    Task ||--o{ Subtask : "broken into"
    Task ||--o{ Comment : "discussed in"
    Task ||--o{ ActivityLog : "tracked by"

    User {
        ObjectId id PK
        string name
        string email UK
        string passwordHash
        string role "ADMIN | MANAGER | MEMBER | VIEWER"
        string title
        string avatar
    }

    Project {
        ObjectId id PK
        string name
        string key "e.g. NOVA"
        string description
        string status "ACTIVE | ON_HOLD | COMPLETED | ARCHIVED"
        string priority "LOW | MEDIUM | HIGH | URGENT"
        ObjectId ownerId FK
        datetime dueDate
    }

    Task {
        ObjectId id PK
        string title
        string description
        string status "TODO | IN_PROGRESS | IN_REVIEW | DONE"
        string priority "LOW | MEDIUM | HIGH | URGENT"
        int order
        ObjectId projectId FK
        ObjectId creatorId FK
        ObjectId assigneeId FK
        datetime dueDate
    }

    Subtask {
        ObjectId id PK
        string title
        boolean completed
        ObjectId taskId FK
    }

    Comment {
        ObjectId id PK
        string content
        ObjectId taskId FK
        ObjectId authorId FK
        datetime createdAt
    }

    ActivityLog {
        ObjectId id PK
        string action
        string details
        ObjectId taskId FK
        ObjectId userId FK
        datetime createdAt
    }
```

### Indexed Collections on MongoDB Atlas (`nova` Database)
- **`User`**: Indexed on `email` (unique).
- **`Project`**: Indexed on `ownerId`, `key`.
- **`ProjectMember`**: Composite index on `[projectId, userId]` (unique).
- **`Task`**: Composite index on `[projectId, status, order]` for ultra-fast Kanban column retrieval.
- **`Subtask`**: Indexed on `taskId`.
- **`Comment`**: Indexed on `[taskId, createdAt]`.
- **`ActivityLog`**: Indexed on `[taskId, createdAt]`.

---

## 5. Real-Time WebSocket Architecture

NOVA implements a unified server architecture using `server.js`. The same HTTP server handles Next.js requests and Socket.io WebSocket connections.

### 1. Connection & Handshake Security
Every WebSocket connection undergoes mandatory JWT verification inside `io.use()`:
```javascript
// server.js
io.use(async (socket, next) => {
  let token = socket.handshake.auth?.token;
  if (!token && socket.handshake.headers?.cookie) {
    const match = socket.handshake.headers.cookie.match(/nova_token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return next(new Error("Authentication error: No token provided"));

  const { payload } = await jwtVerify(token, encodedSecret);
  socket.user = payload;
  return next();
});
```

### 2. Event Dictionary

| Event Name | Direction | Payload | Behavior / Effect |
|---|---|---|---|
| `project:join` | Client $\rightarrow$ Server | `projectId` | Socket joins dedicated project room for isolated broadcasts. |
| `project:leave`| Client $\rightarrow$ Server | `projectId` | Socket leaves project room. |
| `task:moved` | Client $\leftrightarrow$ Server | `{ taskId, projectId, newStatus, newOrder }` | Broadcasted to room peers; updates remote Kanban board optimistically without reload. |
| `task:created` | Client $\leftrightarrow$ Server | `{ taskId, projectId, task }` | Adds new task card to peer boards in real-time. |
| `task:updated` | Client $\leftrightarrow$ Server | `{ taskId, projectId, task }` | Syncs title, priority, assignee changes. |
| `task:deleted` | Client $\leftrightarrow$ Server | `{ taskId, projectId }` | Removes task card across all connected clients. |
| `subtask:toggled`| Client $\leftrightarrow$ Server| `{ subtaskId, taskId, projectId, completed }` | Updates subtask progress bars in real-time. |
| `comment:added`| Client $\leftrightarrow$ Server | `{ comment, taskId, projectId }` | Appends comment to active discussion streams. |
| `users:online` | Server $\rightarrow$ Client | `activeUsersCount` | Real-time presence counter in global header. |

---

## 6. Security & Authentication Layer

### 1. Edge Route Protection Middleware (`src/middleware.ts`)
All requests to protected routes (`/dashboard`, `/projects`, `/analytics`, `/team`) are intercepted at the edge:
- Extracts `nova_token` from HTTP-only cookies.
- Verifies JWT integrity using `jose` without cold-start overhead.
- Unauthorized callers are automatically redirected to `/login?from=<requested_url>`.
- Authenticated callers attempting to visit `/login` or `/register` are redirected straight to `/dashboard`.

### 2. BOLA / IDOR Defense (Broken Object Level Authorization)
To prevent unauthorized users from deleting or altering projects/tasks across organizations:
- **`DELETE /api/tasks/[id]` & `PATCH /api/tasks/[id]`**: Queries the parent project of the task and checks whether the authenticated caller is a registered `ProjectMember` (or Admin/Project Owner). Unauthorized callers receive `403 Forbidden`.
- **`DELETE /api/subtasks/[id]`**: Queries the parent task and grandfather project, validating project membership before allowing deletion.

### 3. Privilege Escalation Prevention
- **`POST /api/team`**: Only callers with `ADMIN` or `MANAGER` system roles are authorized to invite new users or modify team member permission levels. Standard `MEMBER` and `VIEWER` roles receive `403 Forbidden`.

### 4. JWT & Password Storage
- Passwords hashed with **BcryptJS** (salt rounds = 10).
- Tokens signed with HMAC-SHA256 (`HS256`) and stored in **HTTP-only, SameSite=Lax** cookies (`nova_token`), preventing XSS token exfiltration.

---

## 7. Comprehensive REST API Reference

### Authentication (`/api/auth/*`)
- **`POST /api/auth/login`**: Authenticates credentials, returns user profile, and sets HTTP-only `nova_token` cookie.
- **`POST /api/auth/register`**: Validates user payload (via Zod), creates User in MongoDB, signs token.
- **`POST /api/auth/demo-login`**: 1-click login for testing (`ADMIN`, `MANAGER`, or `MEMBER`).
- **`GET /api/auth/me`**: Returns the currently authenticated user's session.
- **`POST /api/auth/logout`**: Clears authentication cookies.

### Projects (`/api/projects/*`)
- **`GET /api/projects`**: Lists projects accessible to the user, with completion percentages and active task counts. Supports `?search=` and `?status=`.
- **`POST /api/projects`**: Creates a new project workspace. Automatically assigns creator as project owner and adds them as `ADMIN` in `ProjectMember`.
- **`GET /api/projects/[id]`**: Fetches complete project details, member roster, and all associated tasks.
- **`PATCH /api/projects/[id]`**: Updates project details (name, description, status, priority, due date).
- **`DELETE /api/projects/[id]`**: Deletes project and cascades deletions to tasks, subtasks, and comments.

### Tasks & Subtasks (`/api/tasks/*`, `/api/subtasks/*`)
- **`GET /api/tasks`**: Queries tasks with filtering (`projectId`, `status`, `assigneeId`, `priority`).
- **`POST /api/tasks`**: Creates a task with auto-incremented key (e.g. `NOVA-12`), default order position, and generates initial `ActivityLog`.
- **`GET /api/tasks/[id]`**: Returns task with subtasks, comments, author, and assignee relations.
- **`PATCH /api/tasks/[id]`**: Updates task fields (status, priority, assignee, order).
- **`DELETE /api/tasks/[id]`**: Deletes task, associated subtasks, comments, and logs.
- **`POST /api/tasks/[id]/subtasks`**: Adds a subtask checklist item.
- **`PATCH /api/subtasks/[id]`**: Toggles subtask completion state.
- **`DELETE /api/subtasks/[id]`**: Removes subtask item.
- **`POST /api/tasks/[id]/comments`**: Posts a comment to the task discussion stream.

### Analytics & Team (`/api/analytics`, `/api/team`)
- **`GET /api/analytics`**: Aggregates total tasks, completion rate, overdue tasks, status pipeline volume, priority distribution, and per-engineer workload breakdown.
- **`GET /api/team`**: Returns team members with project assignment counts and task allocations.
- **`POST /api/team`**: Invites/adds team member (restricted to Admin/Manager).

---

## 8. Frontend Design & Component Hierarchy

NOVA's UI is structured into modular, reusable components adhering to the Next.js 14 App Router specifications:

```
src/
├── app/
│   ├── layout.tsx              # Root HTML layout with font, theme, and Toast providers
│   ├── page.tsx                # High-converting Landing page (Hero, Features, Social Proof)
│   ├── login/page.tsx          # Credentials login + 1-Click Demo accounts (Alex, Sarah, David)
│   ├── register/page.tsx       # New user signup form with validation
│   ├── dashboard/page.tsx      # Main dashboard with KPI cards, quick actions, sprint progress
│   ├── projects/
│   │   ├── page.tsx            # Project directory (Grid/Card view, search, creation modal)
│   │   └── [id]/page.tsx       # Dynamic project workspace (Kanban Board & Table views)
│   ├── analytics/page.tsx      # Interactive Recharts metrics (Velocity, Pipelines, Workload)
│   └── team/page.tsx           # Team roster, roles, member search, and invitation modal
├── components/
│   ├── kanban/
│   │   ├── KanbanBoard.tsx     # Drag-and-drop state machine (@hello-pangea/dnd)
│   │   ├── KanbanColumn.tsx    # Column container (TODO, IN_PROGRESS, IN_REVIEW, DONE)
│   │   └── TaskCard.tsx        # Draggable card (Priority badge, subtask count, assignee avatar)
│   ├── layout/
│   │   ├── Sidebar.tsx         # Navigation sidebar (Collapsible, active route indicator)
│   │   └── Header.tsx          # Top navbar with global search (/), presence badge, profile dropdown
│   ├── tasks/
│   │   ├── TaskDetailModal.tsx # Task editor, subtask checklist, comment feed, activity timeline
│   │   └── CreateTaskModal.tsx # Task creation dialog with project & assignee pickers
│   └── ui/                     # Badges, buttons, modals, dropdowns, inputs
├── lib/
│   ├── auth.ts                 # Server-side JWT signing and verification helpers
│   ├── prisma.ts               # PrismaClient singleton with connection pooling
│   └── socket.ts               # Client-side Socket.io singleton manager
└── middleware.ts               # Edge authentication and route protection middleware
```

### Key UI Features
1. **Global Search (`/`)**: Pressing `/` anywhere on the application instantly focuses the search bar in the Header and routes to filtered project/task results.
2. **Confetti Micro-Interaction**: Dragging a task into the `DONE` column triggers `canvas-confetti` fireworks.
3. **Sequential Kanban Ordering**: Reordering tasks recalculates discrete integer indices (`0, 1, 2...`) avoiding floating point collision issues.

---

## 9. Verification, Testing & Hardening History

The platform has undergone rigorous automated testing across the entire stack:

| Test Suite | File | What Was Verified | Result |
|---|---|---|---|
| **Security & BOLA Suite** | `scripts/test-all-fixes.py` | BOLA access blocks on task/subtask deletion, role protection on `/api/team`, JWT integrity. | ✅ **100% Passed** |
| **WebSocket E2E Suite** | `scripts/test-websocket.js` | Handshake token rejection on missing auth, authorized peer broadcasts, room isolation. | ✅ **100% Passed** |
| **Full App E2E Lifecycle** | `scripts/verify-full-app.py` | User registration, project creation, task CRUD, subtask toggle, comment posting, analytics aggregation. | ✅ **100% Passed** |
| **Next.js Production Build**| `npm run build` | TypeScript static typing, dynamic route generation, Edge middleware bundling. | ✅ **0 Errors** |

---

## 10. Deployment & DevOps Runbook

### Environment Variables Reference

| Variable Name | Required | Example / Value | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `mongodb+srv://satyam:satyam@backend.vlkhhhz.mongodb.net/nova?retryWrites=true&w=majority&appName=Backend` | MongoDB Atlas cluster connection URI. |
| `JWT_SECRET` | **Yes** | `nova-production-deployment-secret-key-2026` | 32+ character cryptographic secret for signing JWTs. |
| `NODE_ENV` | **Yes** | `production` | Enables Next.js production optimizations. |
| `PORT` | Auto | `3000` | Port on which the HTTP/WebSocket server listens (assigned dynamically by Railway/Render). |
| `ALLOWED_ORIGINS`| Optional | `*` or `https://nova.up.railway.app` | Allowed origins for Socket.io CORS policy. |

### Docker Production Setup

The repository contains a multi-stage [Dockerfile](file:///c:/Users/satya/OneDrive/Desktop/Nova_Assignment/Dockerfile) optimized for production:

```bash
# 1. Build container image
docker build -t nova-platform .

# 2. Run container with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mongodb+srv://satyam:satyam@backend.vlkhhhz.mongodb.net/nova?retryWrites=true&w=majority&appName=Backend" \
  -e JWT_SECRET="your-secure-random-secret" \
  -e NODE_ENV="production" \
  --name nova-app \
  nova-platform
```

### MongoDB Atlas Access Reminder
To allow cloud deployment providers (Railway, Render, AWS, GCP) to connect to MongoDB Atlas:
1. Log in to **MongoDB Atlas** $\rightarrow$ **Security** $\rightarrow$ **Network Access**.
2. Ensure entry `0.0.0.0/0` ("Allow Access from Anywhere") is present.

---

*NOVA Team Productivity Platform — Built and Documented for Production Deployment.*
