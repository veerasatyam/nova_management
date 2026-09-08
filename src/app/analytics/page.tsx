"use client";

import React, { useState, useEffect } from "react";
import { Avatar } from "@/components/common/Avatar";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
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
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, priorityBreakdown, statusBreakdown, memberWorkload } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          Productivity & Velocity Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed metrics on sprint completion, team workload balance, and task statuses.
        </p>
      </div>

      {/* Top metrics summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">Overall Completion</span>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">
            {metrics.completionRate}%
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.doneTasks} of {metrics.totalTasks} tasks closed
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">In-Flight Tasks</span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {metrics.inProgressTasks + metrics.inReviewTasks}
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.inProgressTasks} in dev, {metrics.inReviewTasks} in review
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">Backlog Items</span>
          <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">
            {metrics.todoTasks}
          </p>
          <p className="text-[11px] text-slate-400">Ready to be picked up</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-500">Overdue Risk</span>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {metrics.overdueTasks}
          </p>
          <p className="text-[11px] text-rose-500/80">Past scheduled due date</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Task Volume by Pipeline Stage
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdown}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Allocation Donut Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Risk & Priority Distribution
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityBreakdown}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  label
                >
                  {priorityBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Member Workload Breakdown */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Engineer Workload Distribution
        </h3>
        <p className="text-xs text-slate-400">
          Track pending vs completed assignments per team member to ensure balanced bandwidth.
        </p>

        <div className="space-y-3 pt-2">
          {memberWorkload.map((m: any) => {
            const percent = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
            return (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} src={m.avatar} size="sm" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {m.title || "Software Engineer"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {m.done} done / {m.pending} pending
                    </span>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold block">
                      {percent}% completed
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
