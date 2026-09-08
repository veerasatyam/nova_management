"use client";

import React from "react";
import { TaskItem } from "@/types";
import { PriorityBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/common/Avatar";
import { Calendar, CheckSquare, MessageSquare } from "lucide-react";
import { formatDate, isOverdue } from "@/lib/utils";

interface TaskCardProps {
  task: TaskItem;
  onClick: (task: TaskItem) => void;
  provided?: any;
}

export function TaskCard({ task, onClick, provided }: TaskCardProps) {
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      onClick={() => onClick(task)}
      className="group bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-500/50 dark:hover:border-teal-500/40 transition-all cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top row: Priority & Task Key */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} />
        <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500">
          {task.project?.key ? `${task.project.key}-${task.taskNumber}` : `#${task.taskNumber}`}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 leading-relaxed">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-normal">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.split(",").map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: Indicators & Assignee */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          {/* Due date */}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 ${
                overdue
                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                  : "text-slate-400 dark:text-slate-500"
              }`}
              title={overdue ? "Overdue!" : "Due date"}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Subtasks counter */}
          {totalSubtasks > 0 && (
            <div
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400"
              title={`Subtasks: ${completedSubtasks}/${totalSubtasks}`}
            >
              <CheckSquare className="w-3 h-3 text-slate-400" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {/* Comments counter */}
          {(task._count?.comments || 0) > 0 && (
            <div
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400"
              title="Comments"
            >
              <MessageSquare className="w-3 h-3 text-slate-400" />
              <span>{task._count?.comments}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <Avatar
            name={task.assignee.name}
            src={task.assignee.avatar}
            size="xs"
            className="ring-2 ring-white dark:ring-slate-900"
          />
        ) : (
          <div
            className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] text-slate-400"
            title="Unassigned"
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
}
