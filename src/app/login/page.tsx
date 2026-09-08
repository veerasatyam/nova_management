"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, Code } from "lucide-react";

export default function LoginPage() {
  const { login, demoLogin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setSubmitting(true);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">
              NOVA
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-200">Welcome Back</h2>
          <p className="text-xs text-slate-400">
            Sign in to access projects, tasks, and team analytics.
          </p>
        </div>

        {/* 1-Click Recruiter Logins Banner */}
        <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-950/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
            <Sparkles className="w-4 h-4" />
            <span>1-Click Recruiter / Demo Access</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Click any persona below to immediately test all role features without filling credentials:
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => demoLogin("admin")}
              disabled={loading}
              className="p-2.5 rounded-xl border border-teal-500/20 bg-slate-900/80 hover:bg-teal-950/60 hover:border-teal-400/50 text-left transition group"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400 mb-1" />
              <p className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                Admin
              </p>
              <p className="text-[10px] text-slate-400">Alex R.</p>
            </button>

            <button
              onClick={() => demoLogin("manager")}
              disabled={loading}
              className="p-2.5 rounded-xl border border-teal-500/20 bg-slate-900/80 hover:bg-teal-950/60 hover:border-teal-400/50 text-left transition group"
            >
              <UserCheck className="w-4 h-4 text-blue-400 mb-1" />
              <p className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                Product Mgr
              </p>
              <p className="text-[10px] text-slate-400">Sarah C.</p>
            </button>

            <button
              onClick={() => demoLogin("developer")}
              disabled={loading}
              className="p-2.5 rounded-xl border border-teal-500/20 bg-slate-900/80 hover:bg-teal-950/60 hover:border-teal-400/50 text-left transition group"
            >
              <Code className="w-4 h-4 text-purple-400 mb-1" />
              <p className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                Engineer
              </p>
              <p className="text-[10px] text-slate-400">David K.</p>
            </button>
          </div>
        </div>

        {/* Traditional Sign In Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@nova.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:opacity-50 text-slate-950 font-bold transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? "Signing in..." : "Sign In with Credentials"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-teal-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
