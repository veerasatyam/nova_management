import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("nova123456", 10);

  // 1. Create Users
  console.log("Creating team members...");
  const alex = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "alex.rivera@nova.app",
      passwordHash,
      title: "Engineering Lead",
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "sarah.chen@nova.app",
      passwordHash,
      title: "Senior Product Manager",
      role: "MANAGER",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
  });

  const david = await prisma.user.create({
    data: {
      name: "David Kim",
      email: "david.kim@nova.app",
      passwordHash,
      title: "Full Stack Engineer",
      role: "MEMBER",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const elena = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      email: "elena.rostova@nova.app",
      passwordHash,
      title: "Staff Product Designer",
      role: "MEMBER",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: "Marcus Brody",
      email: "marcus.brody@nova.app",
      passwordHash,
      title: "Cloud & DevOps Architect",
      role: "MEMBER",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 2. Create Projects
  console.log("Creating projects...");
  const projectNova = await prisma.project.create({
    data: {
      name: "NOVA 2.0 Web Platform",
      key: "NOVA",
      description: "Flagship productivity application with responsive Kanban boards, real-time collaboration, and productivity analytics.",
      status: "ACTIVE",
      priority: "HIGH",
      color: "#0d9488",
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ownerId: alex.id,
      members: {
        create: [
          { userId: alex.id, role: "ADMIN" },
          { userId: sarah.id, role: "MANAGER" },
          { userId: david.id, role: "MEMBER" },
          { userId: elena.id, role: "MEMBER" },
          { userId: marcus.id, role: "MEMBER" },
        ],
      },
    },
  });

  const projectMobile = await prisma.project.create({
    data: {
      name: "Mobile Companion App",
      key: "MOB",
      description: "Native-feel mobile client for offline task capture, push notifications, and quick status check-ins.",
      status: "ACTIVE",
      priority: "MEDIUM",
      color: "#6366f1",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      ownerId: sarah.id,
      members: {
        create: [
          { userId: sarah.id, role: "MANAGER" },
          { userId: david.id, role: "MEMBER" },
          { userId: elena.id, role: "MEMBER" },
        ],
      },
    },
  });

  const projectInfra = await prisma.project.create({
    data: {
      name: "Cloud Infrastructure & CI/CD",
      key: "INFRA",
      description: "Multi-region zero-downtime deployment pipeline, Docker containerization, and Prometheus observability.",
      status: "ACTIVE",
      priority: "URGENT",
      color: "#f59e0b",
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      ownerId: marcus.id,
      members: {
        create: [
          { userId: marcus.id, role: "ADMIN" },
          { userId: alex.id, role: "ADMIN" },
        ],
      },
    },
  });

  // 3. Create Tasks for NOVA
  console.log("Creating tasks and subtasks...");
  const t1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      title: "Design Linear-style Dark/Light Design System",
      description: "Craft modern typography, contrast tokens, button variants, and modal components using Tailwind CSS.",
      status: "DONE",
      priority: "HIGH",
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      order: 0,
      estimatedHours: 16,
      actualHours: 14,
      tags: "Design,UI/UX,Frontend",
      projectId: projectNova.id,
      creatorId: sarah.id,
      assigneeId: elena.id,
      subtasks: {
        create: [
          { title: "Define color palette and semantic tokens", completed: true, order: 0 },
          { title: "Create button and input primitives", completed: true, order: 1 },
          { title: "Validate WCAG AA accessibility contrast", completed: true, order: 2 },
        ],
      },
      comments: {
        create: [
          {
            content: "The dark mode palette with teal accents feels incredibly crisp!",
            userId: alex.id,
          },
          {
            content: "Approved! Exporting design tokens to Tailwind config.",
            userId: elena.id,
          },
        ],
      },
    },
  });

  const t2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      title: "Implement Drag-and-Drop Kanban Board",
      description: "Build fluid drag-and-drop between To Do, In Progress, In Review, and Done columns with optimistic UI updates.",
      status: "DONE",
      priority: "URGENT",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      order: 1,
      estimatedHours: 20,
      actualHours: 18,
      tags: "Frontend,Kanban,Core",
      projectId: projectNova.id,
      creatorId: alex.id,
      assigneeId: david.id,
      subtasks: {
        create: [
          { title: "Set up @hello-pangea/dnd droppable columns", completed: true, order: 0 },
          { title: "Add optimistic state reordering", completed: true, order: 1 },
          { title: "Handle edge cases during fast card dropping", completed: true, order: 2 },
        ],
      },
      comments: {
        create: [
          {
            content: "Tested with 50+ cards, interactions are buttery smooth at 60fps.",
            userId: david.id,
          },
        ],
      },
    },
  });

  const t3 = await prisma.task.create({
    data: {
      taskNumber: 3,
      title: "Build Productivity & Progress Dashboard",
      description: "Create interactive Recharts visualisations showing completion rates, priority distribution, and team workload.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      order: 0,
      estimatedHours: 12,
      actualHours: 6,
      tags: "Analytics,Frontend",
      projectId: projectNova.id,
      creatorId: sarah.id,
      assigneeId: david.id,
      subtasks: {
        create: [
          { title: "API route for aggregated project statistics", completed: true, order: 0 },
          { title: "Burndown velocity & completion progress chart", completed: true, order: 1 },
          { title: "Team member workload distribution bar chart", completed: false, order: 2 },
        ],
      },
      comments: {
        create: [
          {
            content: "Ensure chart tooltips work cleanly in both dark and light modes.",
            userId: sarah.id,
          },
        ],
      },
    },
  });

  const t4 = await prisma.task.create({
    data: {
      taskNumber: 4,
      title: "JWT Authentication & Role-Based Access Control",
      description: "Secure session cookies, bcrypt password hashing, and role permissions (Admin, Manager, Member, Viewer).",
      status: "DONE",
      priority: "URGENT",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      order: 2,
      estimatedHours: 14,
      actualHours: 12,
      tags: "Auth,Security,Backend",
      projectId: projectNova.id,
      creatorId: alex.id,
      assigneeId: alex.id,
      subtasks: {
        create: [
          { title: "Implement bcrypt password hashing", completed: true, order: 0 },
          { title: "Edge-ready JWT signing with jose", completed: true, order: 1 },
          { title: "Add 1-Click Demo Login credentials for reviewers", completed: true, order: 2 },
        ],
      },
    },
  });

  const t5 = await prisma.task.create({
    data: {
      taskNumber: 5,
      title: "Task Detail Drawer with Checklist & Discussions",
      description: "Slide-over drawer supporting rich description editing, subtask toggling, member assignment, and commenting.",
      status: "IN_REVIEW",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      order: 0,
      estimatedHours: 15,
      actualHours: 14,
      tags: "UI/UX,Frontend",
      projectId: projectNova.id,
      creatorId: sarah.id,
      assigneeId: elena.id,
      subtasks: {
        create: [
          { title: "Subtasks add, check, and delete", completed: true, order: 0 },
          { title: "Comment feed with avatars and timestamps", completed: true, order: 1 },
          { title: "Activity audit trail displaying who changed what", completed: true, order: 2 },
        ],
      },
    },
  });

  const t6 = await prisma.task.create({
    data: {
      taskNumber: 6,
      title: "Comprehensive Filter & Search Engine",
      description: "Real-time debounced search by title, tag, priority, and assignee across both Kanban and Table views.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      order: 0,
      estimatedHours: 8,
      tags: "Search,Frontend",
      projectId: projectNova.id,
      creatorId: david.id,
      assigneeId: david.id,
    },
  });

  const t7 = await prisma.task.create({
    data: {
      taskNumber: 7,
      title: "Project Member Invitation & Permissions Modal",
      description: "Allow project admins to add collaborators, assign project-level roles, and manage team roster.",
      status: "TODO",
      priority: "LOW",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      order: 1,
      estimatedHours: 10,
      tags: "Team,Collaboration",
      projectId: projectNova.id,
      creatorId: sarah.id,
      assigneeId: sarah.id,
    },
  });

  // Mobile Tasks
  await prisma.task.create({
    data: {
      taskNumber: 1,
      title: "Setup React Native / PWA Shell with Offline Sync",
      description: "Initialize progressive web app shell with service worker caching for offline access.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      order: 0,
      estimatedHours: 24,
      actualHours: 10,
      tags: "Mobile,PWA",
      projectId: projectMobile.id,
      creatorId: sarah.id,
      assigneeId: david.id,
    },
  });

  await prisma.task.create({
    data: {
      taskNumber: 2,
      title: "Push Notifications on Task Assignment",
      description: "Deliver real-time push alerts when a team member is assigned or mentioned in a comment.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      order: 0,
      estimatedHours: 16,
      tags: "Mobile,Notifications",
      projectId: projectMobile.id,
      creatorId: sarah.id,
      assigneeId: elena.id,
    },
  });

  // Infra Tasks
  await prisma.task.create({
    data: {
      taskNumber: 1,
      title: "Multi-Stage Dockerfile & Docker Compose Setup",
      description: "Production-ready alpine containerization with non-root security and healthcheck endpoints.",
      status: "DONE",
      priority: "URGENT",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      order: 0,
      estimatedHours: 8,
      actualHours: 6,
      tags: "DevOps,Docker",
      projectId: projectInfra.id,
      creatorId: marcus.id,
      assigneeId: marcus.id,
    },
  });

  await prisma.task.create({
    data: {
      taskNumber: 2,
      title: "Automated GitHub Actions CI/CD Pipeline",
      description: "Build check, lint check, type check, and automatic staging deployment on pull request merge.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      order: 0,
      estimatedHours: 12,
      actualHours: 8,
      tags: "CI/CD,DevOps",
      projectId: projectInfra.id,
      creatorId: marcus.id,
      assigneeId: marcus.id,
    },
  });

  // Seed Activity Logs
  console.log("Seeding activity logs...");
  await prisma.activityLog.createMany({
    data: [
      {
        action: "CREATED_PROJECT",
        details: "Created project NOVA 2.0 Web Platform",
        projectId: projectNova.id,
        userId: alex.id,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        action: "STATUS_CHANGE",
        details: 'Moved task "Implement Drag-and-Drop Kanban Board" to DONE',
        projectId: projectNova.id,
        taskId: t2.id,
        userId: david.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        action: "ADDED_COMMENT",
        details: 'Commented on "Design Linear-style Dark/Light Design System"',
        projectId: projectNova.id,
        taskId: t1.id,
        userId: alex.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        action: "STATUS_CHANGE",
        details: 'Moved task "Task Detail Drawer with Checklist & Discussions" to IN_REVIEW',
        projectId: projectNova.id,
        taskId: t5.id,
        userId: elena.id,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Database successfully seeded with rich demo data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
