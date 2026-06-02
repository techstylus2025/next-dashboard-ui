/** Dashboard accents aligned with Menu icon gradients */

export const userCardTheme = {
  admin: {
    card: "bg-gradient-to-br from-slate-500 to-slate-700 shadow-md shadow-slate-500/30 ring-2 ring-white/20",
    badge: "bg-white/20 text-white",
    label: "text-white/80",
    count: "text-white",
  },
  teacher: {
    card: "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/30 ring-2 ring-white/20",
    badge: "bg-white/20 text-white",
    label: "text-white/80",
    count: "text-white",
  },
  student: {
    card: "bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-500/30 ring-2 ring-white/20",
    badge: "bg-white/20 text-white",
    label: "text-white/80",
    count: "text-white",
  },
  parent: {
    card: "bg-gradient-to-br from-rose-400 to-pink-600 shadow-md shadow-rose-500/25 ring-2 ring-white/20",
    badge: "bg-white/20 text-white",
    label: "text-white/80",
    count: "text-white",
  },
} as const;

export const chartPanelClass =
  "rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-4 h-full shadow-sm";

export const chartColors = {
  students: {
    boys: "#38bdf8", // sky-400
    girls: "#f472b6", // pink-400
    total: "#f1f5f9", // slate-100
    boysLegend: "bg-gradient-to-br from-sky-400 to-blue-500 shadow-sm shadow-sky-400/40",
    girlsLegend: "bg-gradient-to-br from-fuchsia-400 to-pink-500 shadow-sm shadow-fuchsia-400/30",
  },
  attendance: {
    present: "#10b981", // emerald-500
    absent: "#f43f5e", // rose-500
    grid: "#e2e8f0",
  },
  finance: {
    income: "#14b8a6", // teal-500
    expense: "#8b5cf6", // violet-500
    grid: "#e2e8f0",
  },
} as const;
