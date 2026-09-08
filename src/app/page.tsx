"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  ArrowRight,
  Kanban,
  BarChart3,
  Users2,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  Cpu,
} from "lucide-react";

export default function LandingPage() {
  const { demoLogin, loading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white flex flex-col">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            NOVA
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition"
          >
            Sign In
          </Link>
          <button
            onClick={() => demoLogin("manager")}
            disabled={loading}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition shadow-md shadow-teal-500/20"
          >
            Launch Live Demo
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-20 pb-16 text-center max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-medium mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen Team Productivity Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-tight">
          <span className="block text-white">Plan. Collaborate.</span>
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Deliver with Velocity.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          NOVA brings projects, drag-and-drop Kanban boards, checklists, discussions, and burndown analytics into one cohesive workspace designed for modern teams.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => demoLogin("manager")}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <span>Explore Demo as Product Manager</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition"
          >
            Sign In with Email
          </Link>
        </div>

        {/* 1-Click Persona Previews */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-500">Quick Recruiter Access:</span>
          <button
            onClick={() => demoLogin("admin")}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 transition"
          >
            Engineering Lead (Admin)
          </button>
          <button
            onClick={() => demoLogin("manager")}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 transition"
          >
            Product Manager
          </button>
          <button
            onClick={() => demoLogin("developer")}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 transition"
          >
            Full Stack Engineer
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Kanban className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Interactive Kanban Board</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag-and-drop workflow across To Do, In Progress, In Review, and Done columns with optimistic UI updates and celebrations.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Productivity Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time burndown charts, completion rate telemetry, and engineer workload distribution powered by Recharts.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Team Collaboration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Task discussions, subtasks checklist, activity audit trails, and role-based permissions (Admin, PM, Member).
            </p>
          </div>
        </div>

        {/* Tech Stack Banner */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 w-full flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Built With:</span>
          <span>Next.js 14 App Router</span>
          <span>•</span>
          <span>TypeScript</span>
          <span>•</span>
          <span>Tailwind CSS</span>
          <span>•</span>
          <span>Prisma ORM</span>
          <span>•</span>
          <span>JWT Auth & Bcrypt</span>
          <span>•</span>
          <span>Docker Ready</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        NOVA Team Productivity Platform © 2026. Designed for Full Stack Engineering Assignment.
      </footer>
    </div>
  );
}
