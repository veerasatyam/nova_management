import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 shadow-lg shadow-teal-500/10">
        <Sparkles className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
        The requested resource or project could not be found. It may have been moved or deleted.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>
    </div>
  );
}
