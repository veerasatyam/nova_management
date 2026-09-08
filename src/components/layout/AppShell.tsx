"use client";

import React, { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // If on login, register, or marketing root, render cleanly without full app shell
  const isAuthOrLanding = pathname === "/login" || pathname === "/register" || pathname === "/";

  if (isAuthOrLanding) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onOpenCreateTask={() => setCreateTaskOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onOpenCreateProject={() => setCreateProjectOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {createTaskOpen && (
        <CreateTaskModal
          isOpen={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          onSuccess={() => {
            setCreateTaskOpen(false);
            window.dispatchEvent(new CustomEvent("nova:refresh"));
          }}
        />
      )}

      {createProjectOpen && (
        <CreateProjectModal
          isOpen={createProjectOpen}
          onClose={() => setCreateProjectOpen(false)}
          onSuccess={() => {
            setCreateProjectOpen(false);
            window.dispatchEvent(new CustomEvent("nova:refresh"));
          }}
        />
      )}
    </div>
  );
}
