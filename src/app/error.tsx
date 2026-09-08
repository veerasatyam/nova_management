"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-xs text-slate-400 mt-2 max-w-sm">
        An unexpected error occurred. Please try reloading the view.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
