import React from "react";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus, AlertCircle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

  const renderIcon = () => {
    switch (priority) {
      case "LOW":
        return <ArrowDown className="w-3 h-3 text-slate-500" />;
      case "MEDIUM":
        return <Minus className="w-3 h-3 text-sky-500" />;
      case "HIGH":
        return <ArrowUp className="w-3 h-3 text-orange-500" />;
      case "URGENT":
        return <AlertCircle className="w-3 h-3 text-rose-500" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {renderIcon()}
      {config.label}
    </span>
  );
}
