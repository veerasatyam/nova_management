"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectItem, TaskItem, TaskStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { useSocket } from "@/context/SocketContext";
import { Avatar } from "@/components/common/Avatar";
import { PriorityBadge, StatusBadge } from "@/components/common/Badge";
import { formatDate } from "@/lib/utils";
import {
  Kanban,
  ListFilter,
  BarChart3,
  Users2,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  UserPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"board" | "list" | "analytics" | "team">("board");

  const { socket, joinProject, leaveProject, emitTaskMoved } = useSocket();

  const router = useRouter();
  const { user } = useAuth();

  // Modals
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<TaskStatus>("TODO");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  // Project Delete Confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const canDelete = Boolean(
    user &&
    (user.role === "ADMIN" ||
     project?.ownerId === user.id ||
     project?.members?.some((m) => m.userId === user.id && m.role === "ADMIN"))
  );

  const handleDeleteProject = async () => {
    if (!project) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete project");
      }
      router.push("/projects");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete project");
      setDeleting(false);
    }
  };

  const loadProject = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setTasks(data.project.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    if (projectId) {
      joinProject(projectId);
    }

    if (socket) {
      const handleRemoteMove = (data: { taskId: string; newStatus: TaskStatus; newOrder: number }) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === data.taskId ? { ...t, status: data.newStatus, order: data.newOrder } : t
          )
        );
      };

      const handleRemoteCreate = (data: { task: TaskItem }) => {
        setTasks((prev) => [data.task, ...prev.filter((t) => t.id !== data.task.id)]);
      };

      socket.on("task:moved", handleRemoteMove);
      socket.on("task:created", handleRemoteCreate);

      return () => {
        socket.off("task:moved", handleRemoteMove);
        socket.off("task:created", handleRemoteCreate);
        leaveProject(projectId);
      };
    }

    const handleRefresh = () => loadProject();
    window.addEventListener("nova:refresh", handleRefresh);
    return () => window.removeEventListener("nova:refresh", handleRefresh);
  }, [projectId, socket]);

  // Handle Drag & Drop move
  const handleTaskMoved = async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    // Optimistic local state update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t))
    );

    // Emit live WebSocket event so all connected peers see the card move instantly!
    emitTaskMoved({
      projectId: project?.id || projectId,
      taskId,
      newStatus,
      newOrder,
    });

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, order: newOrder }),
      });
    } catch (e) {
      console.error(e);
      loadProject();
    }
  };

  const handleOpenAddTask = (status: TaskStatus = "TODO") => {
    setCreateTaskDefaultStatus(status);
    setCreateTaskOpen(true);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !project) return;
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || inviteEmail.split("@")[0],
          role: inviteRole,
          projectId: project.id,
        }),
      });
      if (res.ok) {
        setInviteModalOpen(false);
        setInviteEmail("");
        setInviteName("");
        loadProject();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !project) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-slate-400">
        Project not found.
      </div>
    );
  }

  const stats = project.taskStats || {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "DONE").length,
    progressPercentage: 0,
  };

  const priorityData = [
    { name: "Urgent", value: tasks.filter((t) => t.priority === "URGENT").length, color: "#f43f5e" },
    { name: "High", value: tasks.filter((t) => t.priority === "HIGH").length, color: "#f97316" },
    { name: "Medium", value: tasks.filter((t) => t.priority === "MEDIUM").length, color: "#0ea5e9" },
    { name: "Low", value: tasks.filter((t) => t.priority === "LOW").length, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const statusData = [
    { name: "To Do", value: tasks.filter((t) => t.status === "TODO").length, color: "#94a3b8" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "IN_PROGRESS").length, color: "#3b82f6" },
    { name: "In Review", value: tasks.filter((t) => t.status === "IN_REVIEW").length, color: "#f59e0b" },
    { name: "Done", value: tasks.filter((t) => t.status === "DONE").length, color: "#10b981" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Project Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="w-5 h-5 rounded-lg shrink-0 shadow-sm"
              style={{ backgroundColor: project.color || "#0d9488" }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                  {project.key}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {project.name}
                </h1>
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
              {project.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {canDelete && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition"
                title="Delete Project (Admin & Owner only)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>

            <button
              onClick={() => handleOpenAddTask("TODO")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Progress & Team members bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          {/* Progress gauge */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-500 dark:text-slate-400">
                  Progress: {stats.done}/{stats.total} tasks
                </span>
                <span className="text-teal-600 dark:text-teal-400">
                  {stats.progressPercentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.progressPercentage}%`,
                    backgroundColor: project.color || "#0d9488",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Members Avatars */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400">Team:</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {project.members?.map((m) => (
                <Avatar
                  key={m.id}
                  name={m.user?.name}
                  src={m.user?.avatar}
                  size="xs"
                  className="ring-2 ring-white dark:ring-slate-900"
                />
              ))}
            </div>
            {project.dueDate && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-2">
                <Calendar className="w-3.5 h-3.5" />
                Target: {formatDate(project.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("board")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === "board"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Kanban className="w-4 h-4" />
          Kanban Board
        </button>

        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === "list"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ListFilter className="w-4 h-4" />
          Table / List
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === "analytics"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Project Analytics
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === "team"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users2 className="w-4 h-4" />
          Collaborators ({project.members?.length || 0})
        </button>
      </div>

      {/* Tab 1: Kanban Board */}
      {activeTab === "board" && (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={(t) => setSelectedTask(t)}
          onAddTask={(st) => handleOpenAddTask(st)}
          onTaskMoved={handleTaskMoved}
        />
      )}

      {/* Tab 2: Table / List View */}
      {activeTab === "list" && (
        <TaskListView
          tasks={tasks}
          onTaskClick={(t) => setSelectedTask(t)}
          onStatusChange={async (taskId, status) => {
            await handleTaskMoved(taskId, status, 0);
          }}
        />
      )}

      {/* Tab 3: Project Analytics */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status distribution chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Task Status Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Priority Allocation
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      label
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400 italic">No tasks in this project</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Team Collaborators */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Project Members
            </h3>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite Member
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.members?.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.user?.name} src={m.user?.avatar} size="md" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {m.user?.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {m.user?.email}
                    </p>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      {m.user?.title || "Engineer"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => loadProject()}
          teamMembers={project.members?.map((m) => m.user)}
        />
      )}

      {/* Create Task Modal */}
      {createTaskOpen && (
        <CreateTaskModal
          isOpen={createTaskOpen}
          defaultProjectId={project.id}
          defaultStatus={createTaskDefaultStatus}
          onClose={() => setCreateTaskOpen(false)}
          onSuccess={() => {
            setCreateTaskOpen(false);
            loadProject();
          }}
        />
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setInviteModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Invite Collaborator to {project.name}
            </h3>
            <form onSubmit={handleInviteMember} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="maya@nova.app"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Project Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ADMIN">Admin (Full Control)</option>
                  <option value="MANAGER">Manager (Can edit & assign)</option>
                  <option value="MEMBER">Member (Can work on tasks)</option>
                  <option value="VIEWER">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold"
                >
                  Add Collaborator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Project</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permanent destruction</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="font-semibold text-slate-900 dark:text-white">"{project.name}"</strong>? All associated tasks, subtasks, discussions, and member assignments will be permanently removed. This action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteError("");
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 transition shadow-md shadow-rose-600/30 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
