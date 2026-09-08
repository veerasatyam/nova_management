"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Users2,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ProjectItem } from "@/types";

interface SidebarProps {
  onOpenCreateProject?: () => void;
}

export function Sidebar({ onOpenCreateProject }: SidebarProps) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((data) => setProjects(data.projects || []))
      .catch(() => {});
  }, [pathname]);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/team", label: "Team & Workload", icon: Users2 },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between shrink-0 hidden md:flex transition-colors">
      <div className="p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Workspace
          </p>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Projects Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Projects ({projects.length})
            </p>
            {onOpenCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="p-1 rounded text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Create Project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isCurrent = pathname === `/projects/${proj.id}` || pathname === `/projects/${proj.key}`;
              return (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition group ${
                    isCurrent
                      ? "bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: proj.color || "#0d9488" }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {proj.key}
                  </span>
                </Link>
              );
            })}

            {projects.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-600 italic">
                No active projects
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            NOVA Platform
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            High-velocity project tracking & team alignment.
          </p>
        </div>
      </div>
    </aside>
  );
}
