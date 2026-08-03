"use client";

import MenuPanel, {
  type MenuItemConfig,
  type MenuSection,
} from "@/components/MenuPanel";
import { getDashboardPath } from "@/lib/dashboard";
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

/** Gradient + shadow for icon tiles (icons are inverted to white) */
const navIconAccent: Record<string, string> = {
  Home: "bg-gradient-to-br from-sky-400 to-blue-600 shadow-md shadow-sky-500/35",
  Teachers:
    "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/30",
  Students:
    "bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-500/30",
  Parents:
    "bg-gradient-to-br from-rose-400 to-pink-600 shadow-md shadow-rose-500/25",
  Subjects:
    "bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/30",
  Classes:
    "bg-gradient-to-br from-cyan-400 to-blue-500 shadow-md shadow-cyan-500/25",
  Fees: "bg-gradient-to-br from-lime-400 to-green-600 shadow-md shadow-lime-500/25",
  "Purchase Books":
    "bg-gradient-to-br from-fuchsia-400 to-purple-600 shadow-md shadow-fuchsia-500/25",
  Transport:
    "bg-gradient-to-br from-orange-400 to-amber-600 shadow-md shadow-orange-500/30",
  Lessons:
    "bg-gradient-to-br from-blue-400 to-violet-500 shadow-md shadow-blue-500/25",
  Exams:
    "bg-gradient-to-br from-red-400 to-rose-600 shadow-md shadow-red-500/25",
  Assignments:
    "bg-gradient-to-br from-indigo-400 to-blue-600 shadow-md shadow-indigo-500/25",
  Results:
    "bg-gradient-to-br from-teal-400 to-cyan-600 shadow-md shadow-teal-500/25",
  Attendance:
    "bg-gradient-to-br from-green-400 to-emerald-600 shadow-md shadow-green-500/25",
  Events:
    "bg-gradient-to-br from-purple-400 to-fuchsia-600 shadow-md shadow-purple-500/25",
  Messages:
    "bg-gradient-to-br from-sky-400 to-cyan-500 shadow-md shadow-sky-400/30",
  Announcements:
    "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md shadow-yellow-500/30",
  Profile:
    "bg-gradient-to-br from-slate-500 to-slate-700 shadow-md shadow-slate-500/25",
  Settings:
    "bg-gradient-to-br from-gray-500 to-zinc-700 shadow-md shadow-gray-500/25",
  Help: "bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md shadow-cyan-500/25",
  Logout:
    "bg-gradient-to-br from-red-500 to-rose-700 shadow-md shadow-red-500/35",
};

const defaultIconAccent =
  "bg-gradient-to-br from-slate-400 to-slate-600 shadow-md shadow-slate-400/25";

type RawItem = {
  icon: string;
  label: string;
  href: string;
  visible: string[];
};

const menuSections: { items: RawItem[] }[] = [
  {
    items: [
      {
        icon: "/home.svg",
        label: "Home",
        href: "__DASHBOARD__",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/analytics.svg",
        label: "Analytics",
        href: "/analytics",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/teacher.svg",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/student.svg",
        label: "Students",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/parent.svg",
        label: "Parents",
        href: "/list/parents",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/subject.svg",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["admin"],
      },
      {
        icon: "/class.svg",
        label: "Classes",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/finance.svg",
        label: "Fees",
        href: "/list/fees",
        visible: ["admin", "parent", "student"],
      },
      {
        icon: "/shop.svg",
        label: "Purchase Books",
        href: "/list/purchase-books",
        visible: ["admin", "teacher", "parent", "student"],
      },
      {
        icon: "/bus.svg",
        label: "Transport",
        href: "/list/transport",
        visible: ["admin", "teacher", "parent", "student"],
      },
      {
        icon: "/lesson.svg",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/exam.svg",
        label: "Exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/assignment.svg",
        label: "Assignments",
        href: "/list/assignments",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.svg",
        label: "Results",
        href: "/list/results",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/attendance.svg",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/calendar.svg",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/message.svg",
        label: "Messages",
        href: "/list/messages",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/announcement.svg",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
  {
    items: [
      {
        icon: "/profile.svg",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/setting.svg",
        label: "Settings",
        href: "/list/settings",
        visible: ["admin"],
      },
      {
        icon: "/password.svg",
        label: "Password Manager",
        href: "/list/password-manager",
        visible: ["admin"],
      },
      {
        icon: "/help.svg",
        label: "Help",
        href: "/list/help",
        visible: ["admin", "teacher", "parent", "student"],
      },
      {
        icon: "/logout.svg",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

function getMessageBadge(role: string) {
  if (role === "admin") return 6;
  if (role === "parent") return 2;
  if (role === "teacher") return 1;
  return 0;
}

function toMenuItem(
  item: RawItem,
  role: string,
  unreadCount: number,
  signOut?: () => void
): MenuItemConfig {
  const href =
    item.href === "__DASHBOARD__" ? getDashboardPath(role) : item.href;
  const badge = item.label === "Messages" && unreadCount > 0 ? unreadCount : undefined;

  return {
    icon: item.icon,
    label: item.label,
    href,
    accent: navIconAccent[item.label] ?? defaultIconAccent,
    badge,
    action: item.label === "Logout" ? signOut : undefined,
  };
}

const Menu = () => {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/messages/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        setUnreadCount(data.count);
      } catch {
        /* ignore */
      }
    };

    fetchCount();
  }, [user]);

  const role = user?.publicMetadata.role as string | undefined;
  const clerk = useClerk();

  const sections: MenuSection[] = useMemo(() => {
    if (!role) return [];
    return menuSections
      .map((section) => ({
        items: section.items
          .filter((item) => item.visible.includes(role))
          .map((item) => toMenuItem(item, role, unreadCount, clerk.signOut)),
      }))
      .filter((section) => section.items.length > 0);
  }, [role, unreadCount, clerk]);

  if (!role) {
    return null;
  }

  return (
    <div className="mt-2 flex h-full min-h-0 flex-col lg:mt-3 lg:rounded-3xl lg:border lg:border-slate-800/60 lg:bg-slate-950 lg:shadow-xl lg:shadow-slate-950/20 lg:ring-1 lg:ring-slate-800/40 lg:overflow-hidden">
      <MenuPanel sections={sections} />
    </div>
  );
};

export default Menu;
