"use client";

import React, { useState } from "react";
import { TaskItem, TaskStatus, TaskPriority } from "@/types";
import { Avatar } from "@/components/common/Avatar";
import { StatusBadge, PriorityBadge } from "@/components/common/Badge";
import { formatDate, isOverdue } from "@/lib/utils";
import { Calendar, CheckSquare, MessageSquare, Search, ArrowUpDown } from "lucide-react";

interface TaskListViewProps {
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

export function TaskListView({
  tasks,
  onTaskClick,
  onStatusChange,
}: TaskListViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"key" | "priority" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtered = tasks
    .filter((t) => {
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.tags && t.tags.toLowerCase().includes(search.toLowerCase())) ||
        (t.assignee?.name && t.assignee.name.toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "key") {
        return sortOrder === "asc" ? a.taskNumber - b.taskNumber : b.taskNumber - a.taskNumber;
      }
      if (sortBy === "priority") {
        const pOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const diff = (pOrder[a.priority] || 0) - (pOrder[b.priority] || 0);
        return sortOrder === "asc" ? diff : -diff;
      }
      // date
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const toggleSort = (col: "key" | "priority" | "date") => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === s
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {s === "ALL" ? "All Tasks" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter list..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table / List Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th
                  onClick={() => toggleSort("key")}
                  className="py-3 px-4 cursor-pointer hover:text-teal-600 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Key</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Status</th>
                <th
                  onClick={() => toggleSort("priority")}
                  className="py-3 px-4 cursor-pointer hover:text-teal-600 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Assignee</th>
                <th
                  onClick={() => toggleSort("date")}
                  className="py-3 px-4 cursor-pointer hover:text-teal-600 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Subtasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                const totalSubtasks = task.subtasks?.length || 0;

                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    {/* Key */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {task.project?.key ? `${task.project.key}-${task.taskNumber}` : `#${task.taskNumber}`}
                    </td>

                    {/* Title & Tags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                          {task.title}
                        </span>
                        {task.tags && (
                          <div className="flex gap-1 mt-0.5">
                            {task.tags.split(",").slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
                              >
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {onStatusChange ? (
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="DONE">Done</option>
                        </select>
                      ) : (
                        <StatusBadge status={task.status} />
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={task.assignee.name}
                            src={task.assignee.avatar}
                            size="xs"
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px]">
                            {task.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Due date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {task.dueDate ? (
                        <span
                          className={`flex items-center gap-1.5 ${
                            overdue
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Subtasks count */}
                    <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {totalSubtasks > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-slate-400" />
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No matching tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
