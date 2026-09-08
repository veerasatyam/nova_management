export type UserRole = "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  title?: string | null;
  role: string;
}

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  taskId: string;
}

export interface CommentItem {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: UserSummary;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  details: string;
  userId: string;
  user: UserSummary;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  taskNumber: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  order: number;
  estimatedHours?: number | null;
  actualHours?: number | null;
  tags?: string | null;
  projectId: string;
  creatorId: string;
  assigneeId?: string | null;
  assignee?: UserSummary | null;
  creator?: UserSummary;
  subtasks?: SubtaskItem[];
  comments?: CommentItem[];
  _count?: {
    subtasks?: number;
    comments?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberItem {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user: UserSummary;
}

export interface ProjectItem {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  status: ProjectStatus;
  priority: string;
  color: string;
  startDate?: string | null;
  dueDate?: string | null;
  ownerId: string;
  owner?: UserSummary;
  members?: ProjectMemberItem[];
  tasks?: TaskItem[];
  _count?: {
    tasks?: number;
    members?: number;
  };
  taskStats?: {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
    inReview: number;
    progressPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}
