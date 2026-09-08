"use client";

import React from "react";
import Link from "next/link";
import { ProjectItem } from "@/types";
import { PriorityBadge } from "@/components/common/Badge";
import { Avatar } from "@/components/common/Avatar";
import { formatDate } from "@/lib/utils";
import { Calendar, CheckCircle2, ChevronRight } from "lucide-react";

interface ProjectCardProps {
  project: ProjectItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const stats = project.taskStats || {
    total: 0,
    done: 0,
    progressPercentage: 0,
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all"
    >
      {/* Top row: Color pill, Key, Priority */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-md shrink-0 shadow-sm"
            style={{ backgroundColor: project.color || "#0d9488" }}
          />
          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
            {project.key}
          </span>
        </div>
        <PriorityBadge priority={project.priority} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
        {project.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed min-h-[36px]">
        {project.description || "No project description provided."}
      </p>

      {/* Progress section */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Progress
          </span>
          <span className="text-slate-800 dark:text-slate-200">
            {stats.progressPercentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stats.progressPercentage}%`,
              backgroundColor: project.color || "#0d9488",
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {stats.done} of {stats.total} tasks completed
          </span>
          {project.dueDate && (
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3" />
              {formatDate(project.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Members stack & View arrow */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex -space-x-1.5 overflow-hidden">
          {project.members && project.members.length > 0 ? (
            project.members.slice(0, 4).map((m) => (
              <Avatar
                key={m.id}
                name={m.user?.name}
                src={m.user?.avatar}
                size="xs"
                className="ring-2 ring-white dark:ring-slate-900"
              />
            ))
          ) : (
            <Avatar name="Admin" size="xs" />
          )}
          {project.members && project.members.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              +{project.members.length - 4}
            </div>
          )}
        </div>

        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center group-hover:translate-x-0.5 transition-transform">
          Open <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </span>
      </div>
    </Link>
  );
}
