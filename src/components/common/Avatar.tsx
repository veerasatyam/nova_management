import React from "react";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export function Avatar({ name = "User", src, size = "md", className = "" }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || "User"}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // Generate deterministic pastel background from name
  const colors = [
    "bg-teal-500 text-white",
    "bg-indigo-500 text-white",
    "bg-sky-500 text-white",
    "bg-emerald-500 text-white",
    "bg-violet-500 text-white",
    "bg-amber-500 text-white",
    "bg-rose-500 text-white",
  ];
  const charCode = (name || "U").charCodeAt(0) + (name || "U").charCodeAt((name?.length || 1) - 1);
  const colorClass = colors[charCode % colors.length];

  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium select-none shadow-sm ${colorClass} ${sizeClasses[size]} ${className}`}
      title={name || "User"}
    >
      {getInitials(name || "User")}
    </div>
  );
}
