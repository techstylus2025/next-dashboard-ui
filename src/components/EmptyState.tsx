import React, { ReactNode } from "react";
import { CalendarDays, Users, Sparkles, BookOpen, Bell } from "lucide-react";

type EmptyStateProps = {
  icon?: ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: "default" | "search" | "error" | "info";
};

const emptyStateVariants = {
  default: {
    icon: <BookOpen className="w-16 h-16" />,
    bgColor: "bg-slate-50",
    iconColor: "text-slate-400",
    titleColor: "text-slate-800",
    messageColor: "text-slate-500",
    buttonColor: "bg-slate-900 hover:bg-slate-800",
  },
  search: {
    icon: <CalendarDays className="w-16 h-16" />,
    bgColor: "bg-sky-50",
    iconColor: "text-sky-300",
    titleColor: "text-sky-900",
    messageColor: "text-sky-600",
    buttonColor: "bg-sky-600 hover:bg-sky-700",
  },
  error: {
    icon: <Bell className="w-16 h-16" />,
    bgColor: "bg-rose-50",
    iconColor: "text-rose-300",
    titleColor: "text-rose-900",
    messageColor: "text-rose-600",
    buttonColor: "bg-rose-600 hover:bg-rose-700",
  },
  info: {
    icon: <Users className="w-16 h-16" />,
    bgColor: "bg-violet-50",
    iconColor: "text-violet-300",
    titleColor: "text-violet-900",
    messageColor: "text-violet-600",
    buttonColor: "bg-violet-600 hover:bg-violet-700",
  },
};

export default function EmptyState({
  icon,
  title = "No Record Found",
  message = "There are no records to display at this time.",
  actionLabel,
  actionHref,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  const styles = emptyStateVariants[variant];
  const displayIcon = icon || styles.icon;

  const handleAction = () => {
    if (actionHref) {
      window.location.href = actionHref;
    } else if (onAction) {
      onAction();
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200/60 ${styles.bgColor} px-6 py-12 text-center shadow-sm`}>
      <div className={`mb-4 flex justify-center ${styles.iconColor}`}>
        {displayIcon}
      </div>
      <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
        {title}
      </h3>
      <p className={`mt-2 text-sm ${styles.messageColor}`}>
        {message}
      </p>
      {actionLabel && (
        <button
          onClick={handleAction}
          className={`mt-6 px-6 py-2 rounded-lg text-white text-sm font-medium transition-colors ${styles.buttonColor}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
