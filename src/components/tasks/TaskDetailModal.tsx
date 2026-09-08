"use client";

import React, { useState, useEffect } from "react";
import { TaskItem, UserSummary, TaskStatus, TaskPriority } from "@/types";
import { Avatar } from "@/components/common/Avatar";
import { PriorityBadge, StatusBadge } from "@/components/common/Badge";
import { formatDate, formatRelativeTime, isOverdue } from "@/lib/utils";
import {
  X,
  CheckSquare,
  Plus,
  Trash2,
  MessageSquare,
  History,
  Calendar,
  User,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
  teamMembers?: UserSummary[];
}

export function TaskDetailModal({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  teamMembers = [],
}: TaskDetailModalProps) {
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "activity">("details");

  // Subtask form
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  // Comment form
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit fields
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setTitleValue(data.task.title);
        setDescriptionValue(data.task.description || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    } else {
      setTask(null);
    }
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  const updateField = async (fields: Record<string, any>) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const data = await res.json();
        setTask((prev: any) => ({ ...prev, ...data.task }));
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Subtask handlers
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtaskTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        setTask((prev: any) => ({
          ...prev,
          subtasks: [...(prev.subtasks || []), data.subtask],
        }));
        setNewSubtaskTitle("");
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          subtasks: prev.subtasks.map((s: any) =>
            s.id === subtaskId ? { ...s, completed } : s
          ),
        }));
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          subtasks: prev.subtasks.filter((s: any) => s.id !== subtaskId),
        }));
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Comment handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;
    try {
      setSubmittingComment(true);
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setTask((prev: any) => ({
          ...prev,
          comments: [data.comment, ...(prev.comments || [])],
        }));
        setNewComment("");
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const completedSubtasks = task?.subtasks?.filter((s: any) => s.completed).length || 0;
  const totalSubtasks = task?.subtasks?.length || 0;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {loading || !task ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {task.project?.key}-{task.taskNumber}
                </span>
                <div className="flex items-center gap-2">
                  {/* Status Picker */}
                  <select
                    value={task.status}
                    onChange={(e) => updateField({ status: e.target.value })}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>

                  {/* Priority Picker */}
                  <select
                    value={task.priority}
                    onChange={(e) => updateField({ priority: e.target.value })}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title Section */}
              <div>
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      className="flex-1 text-base font-bold px-3 py-1.5 rounded-lg border border-teal-500 bg-white dark:bg-slate-900 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        updateField({ title: titleValue });
                        setEditingTitle(false);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setTitleValue(task.title);
                        setEditingTitle(false);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h2
                    onClick={() => setEditingTitle(true)}
                    className="text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition"
                    title="Click to edit title"
                  >
                    {task.title}
                  </h2>
                )}
              </div>

              {/* Meta properties grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                {/* Assignee */}
                <div>
                  <p className="text-slate-400 mb-1 font-medium">Assignee</p>
                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={task.assignee.name} src={task.assignee.avatar} size="xs" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <p className="text-slate-400 mb-1 font-medium">Due Date</p>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>

                {/* Hours */}
                <div>
                  <p className="text-slate-400 mb-1 font-medium">Estimated / Actual</p>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{task.estimatedHours || 0}h / {task.actualHours || 0}h</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  onBlur={() => updateField({ description: descriptionValue })}
                  placeholder="Add a detailed description or requirements..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
                />
              </div>

              {/* Subtasks / Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Subtasks ({completedSubtasks}/{totalSubtasks})
                    </h3>
                  </div>
                  {totalSubtasks > 0 && (
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      {subtaskPercent}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {totalSubtasks > 0 && (
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${subtaskPercent}%` }}
                    />
                  </div>
                )}

                {/* Subtasks list */}
                <div className="space-y-1.5">
                  {task.subtasks?.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
                          className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                        />
                        <span
                          className={`text-xs ${
                            sub.completed
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {sub.title}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Form */}
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a new checklist item..."
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </form>
              </div>

              {/* Tabs: Comments & Activity Log */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                      activeTab === "comments"
                        ? "border-teal-500 text-teal-600 dark:text-teal-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Discussion ({task.comments?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                      activeTab === "activity"
                        ? "border-teal-500 text-teal-600 dark:text-teal-400"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    Activity History
                  </button>
                </div>

                {activeTab === "comments" ? (
                  <div className="space-y-4">
                    {/* Add Comment Input */}
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a message or update..."
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="text-xs px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium flex items-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" /> Post
                      </button>
                    </form>

                    {/* Comments Stream */}
                    <div className="space-y-3">
                      {task.comments?.map((c: any) => (
                        <div
                          key={c.id}
                          className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                        >
                          <Avatar name={c.user?.name} src={c.user?.avatar} size="sm" />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {c.user?.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatRelativeTime(c.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                              {c.content}
                            </p>
                          </div>
                        </div>
                      ))}

                      {(!task.comments || task.comments.length === 0) && (
                        <p className="text-xs text-slate-400 italic text-center py-4">
                          No comments yet. Start the conversation!
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {task.activityLogs?.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={log.user?.name} src={log.user?.avatar} size="xs" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {log.user?.name}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {log.details}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                      </div>
                    ))}

                    {(!task.activityLogs || task.activityLogs.length === 0) && (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        No recent activity recorded for this task.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
