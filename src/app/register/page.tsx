"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setSubmitting(true);
      await register(name, email, password, title);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">
              NOVA
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-200">Create your account</h2>
          <p className="text-xs text-slate-400">
            Join your team on the NOVA Productivity Platform.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Satyam Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Job Title / Role
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="satyam@nova.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Password (min 6 characters) *
              </label>
              <input
                type="password"
                required
                minLength={6}
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
              {submitting ? "Creating account..." : "Sign Up"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
