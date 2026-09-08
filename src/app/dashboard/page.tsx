"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { PriorityBadge, StatusBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/common/Avatar";
import { ProjectItem, TaskItem } from "@/types";
import { formatDate, formatRelativeTime, isOverdue } from "@/lib/utils";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, taskRes, analyticsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/analytics"),
      ]);

      if (projRes.ok) {
        const d = await projRes.json();
        setProjects(d.projects || []);
      }
      if (taskRes.ok) {
        const d = await taskRes.json();
        setTasks(d.tasks || []);
      }
      if (analyticsRes.ok) {
        const d = await analyticsRes.json();
        setAnalytics(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener("nova:refresh", handleRefresh);
    return () => window.removeEventListener("nova:refresh", handleRefresh);
  }, []);

  const metrics = analytics?.metrics || {
    activeProjects: projects.length,
    totalTasks: tasks.length,
    doneTasks: tasks.filter((t) => t.status === "DONE").length,
    overdueTasks: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
    completionRate: 0,
  };

  // Urgent/High priority pending tasks
  const priorityTasks = tasks
    .filter((t) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "DONE")
    .slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-900/40 via-slate-900/60 to-slate-900/40 border border-teal-500/20 backdrop-blur-md">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Workplace Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Welcome back, {user?.name?.split(" ")[0] || "Team"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Here is the current operational status across your active projects and deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/30 transition"
          >
            <span>Explore Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Projects
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.activeProjects}
          </p>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
            Across engineering & product
          </p>
        </div>

        {/* Tasks Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tasks Completed
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.doneTasks} / {metrics.totalTasks}
          </p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Team Velocity
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.completionRate}%
          </p>
          <p className="text-[11px] text-slate-400">
            Overall sprint completion rate
          </p>
        </div>

        {/* Overdue Items */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overdue Tasks
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {metrics.overdueTasks}
          </p>
          <p className="text-[11px] text-rose-500/80 font-medium">
            Requires immediate attention
          </p>
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Active Projects ({projects.length})
          </h2>
          <Link
            href="/projects"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            View all projects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}

          {projects.length === 0 && !loading && (
            <div className="col-span-3 p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-400">
              No projects found. Create your first project to get started!
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Urgent Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority Deliverables */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              High Priority Deliverables
            </h3>
            <span className="text-[11px] text-slate-400">
              {priorityTasks.length} pending
            </span>
          </div>

          <div className="space-y-2.5">
            {priorityTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 truncate">
                  <PriorityBadge priority={t.priority} />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition truncate">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {t.project?.key}-{t.taskNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={t.status} />
                  {t.assignee && (
                    <Avatar name={t.assignee.name} src={t.assignee.avatar} size="xs" />
                  )}
                </div>
              </div>
            ))}

            {priorityTasks.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">
                All high priority tasks are completed! 🎉
              </p>
            )}
          </div>
        </div>

        {/* Live Team Activity Stream */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Live Team Activity
            </h3>
            <span className="text-[11px] text-slate-400">Audit Stream</span>
          </div>

          <div className="space-y-3">
            {analytics?.recentActivity?.map((act: any) => (
              <div
                key={act.id}
                className="flex items-start gap-3 text-xs py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0"
              >
                <Avatar name={act.user?.name} src={act.user?.avatar} size="xs" className="mt-0.5" />
                <div className="flex-1">
                  <p className="text-slate-800 dark:text-slate-200 leading-tight">
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {act.user?.name}
                    </strong>{" "}
                    {act.details}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>
              </div>
            ))}

            {(!analytics?.recentActivity || analytics.recentActivity.length === 0) && (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No recent activity recorded.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => loadData()}
        />
      )}
    </div>
  );
}
