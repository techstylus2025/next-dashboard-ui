"use client";

import NavbarAnnouncementBell from "@/components/NavbarAnnouncementBell";
import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { buildSuggestionGroups, flattenSuggestionGroups } from "@/lib/searchSuggestions";
import type { DashboardUser } from "@/types/auth";

const Navbar = ({
  onMessagesOpen,
  homeHref,
  customUser,
  supervisorClassName,
  sidebarCollapsed = false,
  onToggleSidebar,
}: {
  onMessagesOpen?: () => void;
  homeHref: string;
  customUser?: DashboardUser | null;
  supervisorClassName?: string | null;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) => {
  const { user } = useUser();
  const [messageCount, setMessageCount] = useState(0);
  const [supervisorClass, setSupervisorClass] = useState<string | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<string[] | null>(null);
  const [studentProfiles, setStudentProfiles] = useState<{
    img: string;
    name: string;
    surname: string;
  }[]>([]);

  const role = ((user?.publicMetadata?.role as string | undefined) ?? customUser?.role)?.toLowerCase();
  const userId = user?.id ?? customUser?.id;
  const pathname = usePathname();
  const [now, setNow] = useState(new Date());
  const [academicPeriod, setAcademicPeriod] = useState<{
    badge: string;
    yearLabel: string | null;
    termNumber: number | null;
    termStart: string | null;
    termEnd: string | null;
  }>({ badge: "", yearLabel: null, termNumber: null, termStart: null, termEnd: null });

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/messages/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        setMessageCount(data.count);
      } catch {
        /* ignore */
      }
    };

    fetchCount();
  }, [user]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAcademicPeriod = async () => {
      try {
        const res = await fetch("/api/active-academic-period", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          badge: string;
          yearLabel: string | null;
          termNumber: number | null;
          termStart: string | null;
          termEnd: string | null;
        };
        setAcademicPeriod(data);
      } catch {
        /* ignore */
      }
    };

    fetchAcademicPeriod();
  }, []);

  useEffect(() => {
    const fetchRoleDetails = async () => {
      if (!userId || !role) return;

      try {
        const res = await fetch(`/api/user/role-details?userId=${userId}&role=${role}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          supervisorClass?: string;
          subjects?: string[];
          students?: { img: string; name: string; surname: string }[];
        };
        if (data.supervisorClass) setSupervisorClass(data.supervisorClass);
        if (data.subjects) setTeacherSubjects(data.subjects);
        if (data.students) setStudentProfiles(data.students.filter((student) => student.img));
      } catch {
        /* ignore */
      }
    };

    fetchRoleDetails();
  }, [userId, role]);

  const displayName = user?.firstName || user?.username || "User";
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  const navItems = useMemo(() => {
    const baseItems =
      role === "admin"
        ? [
            { href: homeHref, label: "Dashboard" },
            { href: "/list/exams", label: "Exams" },
            { href: "/list/lessons", label: "Lessons" },
            { href: "/list/results", label: "Results" },
            { href: "/list/messages", label: "Messages" },
            { href: "/list/settings", label: "Settings" },
          ]
        : role === "teacher"
        ? [
            { href: homeHref, label: "Dashboard" },
            { href: "/list/exams", label: "Exams" },
            { href: "/list/lessons", label: "Lessons" },
            { href: "/list/messages", label: "Messages" },
          ]
        : role === "parent"
        ? [
            { href: homeHref, label: "Dashboard" },
            { href: "/list/exams", label: "Exams" },
            { href: "/list/results", label: "Results" },
          ]
        : [
            { href: homeHref, label: "Dashboard" },
            { href: "/list/exams", label: "Exams" },
            { href: "/list/results", label: "Results" },
          ];

    return baseItems.map((item) => ({
      ...item,
      active: pathname === item.href || pathname.startsWith(item.href + "/"),
    }));
  }, [homeHref, role, pathname]);

  // Determine what to display below the welcome name
  const getSubtitle = () => {
    if (role === "teacher" && teacherSubjects && teacherSubjects.length > 0) {
      return teacherSubjects.join(", ");
    }
    if (role === "teacher" && supervisorClass) {
      return `Class Supervisor: ${supervisorClass}`;
    }
    return null;
  };

  const subtitle = getSubtitle();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ href: homeHref, label: "Dashboard" }];

    const steps: { href: string; label: string }[] = [{ href: homeHref, label: "Home" }];
    let currentPath = "";

    for (const segment of segments) {
      if (segment === "list") continue;

      currentPath += `/${segment}`;

      const label = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());

      steps.push({
        href: currentPath,
        label: label === "Admin" || label === "Teacher" || label === "Parent" || label === "Student" ? "Dashboard" : label,
      });
    }

    return steps.length > 0 ? steps : [{ href: homeHref, label: "Dashboard" }];
  }, [homeHref, pathname]);

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const activeAcademicLabel = academicPeriod.yearLabel && academicPeriod.termNumber !== null
    ? `${academicPeriod.yearLabel} · Term ${academicPeriod.termNumber}`
    : academicPeriod.badge;

  const termWeek = useMemo(() => {
    if (!academicPeriod.termStart || !academicPeriod.termEnd) return null;

    const toUtcDay = (year: number, month: number, day: number) =>
      Date.UTC(year, month - 1, day);
    const parseIsoDay = (value: string) => {
      const [year, month, day] = value.slice(0, 10).split("-").map(Number);
      return toUtcDay(year, month, day);
    };

    const start = parseIsoDay(academicPeriod.termStart);
    const end = parseIsoDay(academicPeriod.termEnd);
    const today = toUtcDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
    if (![start, end, today].every(Number.isFinite) || end < start) return null;

    const daysInTerm = Math.floor((end - start) / 86_400_000) + 1;
    const totalWeeks = Math.ceil(daysInTerm / 7);
    const currentWeek = Math.floor((today - start) / (7 * 86_400_000)) + 1;
    return Math.min(totalWeeks, Math.max(1, currentWeek));
  }, [academicPeriod.termStart, academicPeriod.termEnd, now]);

  const adminDesktopItems = [
    { href: "/admin", label: "Overview" },
    { href: "/analytics", label: "Analytics" },
    { href: "/list/students", label: "Students" },
    { href: "/list/teachers", label: "Teachers" },
    { href: "/list/classes", label: "Classes" },
    { href: "/list/fees", label: "Fees" },
    { href: "/list/lessons", label: "Lessons" },
    { href: "/list/exams", label: "Exams" },
    { href: "/list/results", label: "Results" },
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const studentMenuRef = useRef<HTMLDivElement | null>(null);

  const handleMobileLink = () => setMobileOpen(false);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any | null>(null);
  const debounceRef = useRef<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const flatSuggestions = useRef<Array<{ type: string; item: any }>>([]);

  const onSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  // Debounced suggestions fetch
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setSuggestions(null);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: searchQuery.trim(), suggest: "1" });
        if (userId) params.set("userId", userId);
        if (role) params.set("role", role);
        const res = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) return setSuggestions(null);
        const data = await res.json();
        const grouped = buildSuggestionGroups(
          {
            students: data?.students ?? [],
            teachers: data?.teachers ?? [],
            parents: data?.parents ?? [],
          },
          searchQuery.trim(),
          role,
        );
        setSuggestions(grouped);
        const flat = flattenSuggestionGroups(grouped);
        flatSuggestions.current = flat;
        setFocusedIndex(flat.length > 0 ? 0 : -1);
      } catch {
        setSuggestions(null);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchQuery, userId, role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentMenuRef.current && !studentMenuRef.current.contains(event.target as Node)) {
        setStudentMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="border-b border-white/5 bg-slate-900 px-4 py-1.5 text-[11px] sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-slate-400">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <div key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1">
                {index > 0 && <span className="text-slate-500">/</span>}
                {isLast ? (
                  <span className="font-medium text-slate-200">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="transition hover:text-white">
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      <header className="inset-x-0 w-full bg-slate-950">
        <div className="mx-auto grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-2 text-white sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {onToggleSidebar ? (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 md:inline-flex"
                aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
                title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
              >
                <span aria-hidden="true">{sidebarCollapsed ? "→" : "←"}</span>
              </button>
            ) : null}
            {role !== "admin" ? (
              <Link href={homeHref} className="flex min-w-0 items-center">
                <div className="hidden flex-col leading-tight sm:flex">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">King&apos;s Heart</span>
                  <span className="text-xs font-medium text-slate-100">
                    {role === "teacher" ? "Teacher Dashboard" : role === "parent" ? "Parent Dashboard" : role === "student" ? "Student Dashboard" : "Dashboard"}
                  </span>
                </div>
              </Link>
            ) : null}

            {supervisorClassName ? (
              <span className="hidden max-w-40 truncate rounded-md border border-sky-300/15 bg-sky-300/10 px-2.5 py-1.5 text-[11px] font-medium text-sky-100 xl:inline-flex" title={`Supervisor of ${supervisorClassName}`}>
                Supervisor · {supervisorClassName}
              </span>
            ) : null}

            {role === "admin" && (
              <div className="hidden items-center gap-3 border-l border-white/10 pl-3 xl:flex">
                <div className="flex flex-col text-sm text-slate-300">
                  <span className="font-medium text-slate-100">{formattedDate}</span>
                  <span>{formattedTime}</span>
                </div>
                {activeAcademicLabel ? (
                  <>
                    <div className="h-7 w-px bg-white/10" />
                    <div className="max-w-48 truncate text-sm text-slate-300" title={activeAcademicLabel}>
                      <span className="font-medium text-slate-100">{activeAcademicLabel}</span>
                    </div>
                  </>
                ) : null}
                {termWeek !== null ? (
                  <>
                    <div className="h-7 w-px bg-white/10" />
                    <span className="shrink-0 rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-xs font-semibold text-sky-100">
                      Week {termWeek}
                    </span>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {role !== "admin" && (
            <nav className="col-span-2 row-start-2 flex min-w-0 items-center gap-1 overflow-x-auto border-t border-white/5 pt-1 md:col-span-1 md:col-start-2 md:row-start-1 md:justify-center md:overflow-visible md:border-0 md:pt-0" aria-label="Primary navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={`shrink-0 rounded-md px-2.5 py-2 text-xs font-medium transition-colors lg:px-3 lg:text-sm ${
                    item.active
                      ? "bg-white/10 text-white ring-1 ring-white/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-self-end gap-1.5 sm:gap-2 lg:col-start-3 lg:w-full">
            {role !== "admin" && termWeek !== null ? (
              <span className="shrink-0 rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-[11px] font-semibold text-sky-100 sm:px-2.5 sm:text-xs">
                Week {termWeek}
              </span>
            ) : null}
            <form onSubmit={onSearchSubmit} className="relative hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 transition-colors focus-within:border-sky-300/40 focus-within:bg-white/10 lg:flex lg:max-w-52 lg:flex-1 xl:max-w-60">
              <button type="button" onClick={onSearchSubmit} className="flex h-6 w-6 shrink-0 items-center justify-center" aria-label="Search">
                <Image src="/search.svg" alt="Search" width={14} height={14} className="opacity-70 invert" />
              </button>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setFocusedIndex(-1); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (focusedIndex >= 0 && flatSuggestions.current[focusedIndex]) {
                      const sel = flatSuggestions.current[focusedIndex];
                      setSearchQuery('');
                      router.push(`/list/${sel.type}/${sel.item.id}`);
                      return;
                    }
                    onSearchSubmit();
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedIndex((prev) => Math.min(prev + 1, flatSuggestions.current.length - 1));
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedIndex((prev) => Math.max(prev - 1, 0));
                  }
                  if (e.key === 'Escape') {
                    setSuggestions(null);
                  }
                }}
                type="text"
                placeholder="Search anything..."
                className="min-w-0 w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                aria-label="Global search"
              />

              {searchQuery.trim().length >= 2 && (
                <div role="listbox" aria-label="Search suggestions" aria-live="polite" className="absolute left-0 top-full z-50 mt-2 w-[22rem] max-w-[60vw] rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 fade-in">
                  <div className="p-2">
                    <div className="text-xs text-slate-400 px-2 py-1">Suggestions</div>
                    <div className="max-h-64 overflow-auto">
                      {suggestions?.students?.length > 0 && (
                        <div className="px-2 py-1">
                          <div className="mb-1 text-xs text-slate-500">Students</div>
                          {suggestions.students.map((s: any) => {
                            const globalIndex = flatSuggestions.current.findIndex((f) => f.type === 'students' && f.item.id === s.id);
                            const isFocused = globalIndex === focusedIndex;
                            return (
                              <button
                                role="option"
                                aria-selected={isFocused}
                                key={s.id}
                                onClick={() => { setSearchQuery(''); router.push(`/list/students/${s.id}`); }}
                                onMouseEnter={() => setFocusedIndex(globalIndex)}
                                data-index={globalIndex}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${isFocused ? 'suggestion-focus' : ''}`}
                              >
                                {s.img ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={s.img} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-100" />
                                )}
                                <div className="truncate">
                                  <div className="text-sm font-medium">{s.name} {s.surname}</div>
                                  <div className="text-xs text-slate-500 truncate">{s.username}{s.email ? ` · ${s.email}` : ''}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {suggestions?.teachers?.length > 0 && (
                        <div className="px-2 py-1">
                          <div className="mb-1 text-xs text-slate-500">Teachers</div>
                          {suggestions.teachers.map((t: any) => {
                            const globalIndex = flatSuggestions.current.findIndex((f) => f.type === 'teachers' && f.item.id === t.id);
                            const isFocused = globalIndex === focusedIndex;
                            return (
                              <button
                                role="option"
                                aria-selected={isFocused}
                                key={t.id}
                                onClick={() => { setSearchQuery(''); router.push(`/list/teachers/${t.id}`); }}
                                onMouseEnter={() => setFocusedIndex(globalIndex)}
                                data-index={globalIndex}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${isFocused ? 'suggestion-focus' : ''}`}
                              >
                                {t.img ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={t.img} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-100" />
                                )}
                                <div className="truncate">
                                  <div className="text-sm font-medium">{t.name} {t.surname}</div>
                                  <div className="text-xs text-slate-500 truncate">{t.username}{t.email ? ` · ${t.email}` : ''}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {suggestions?.parents?.length > 0 && (
                        <div className="px-2 py-1">
                          <div className="mb-1 text-xs text-slate-500">Parents</div>
                          {suggestions.parents.map((p: any) => {
                            const globalIndex = flatSuggestions.current.findIndex((f) => f.type === 'parents' && f.item.id === p.id);
                            const isFocused = globalIndex === focusedIndex;
                            return (
                              <button
                                role="option"
                                aria-selected={isFocused}
                                key={p.id}
                                onClick={() => { setSearchQuery(''); router.push(`/list/parents/${p.id}`); }}
                                onMouseEnter={() => setFocusedIndex(globalIndex)}
                                data-index={globalIndex}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${isFocused ? 'suggestion-focus' : ''}`}
                              >
                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700" />
                                <div className="truncate">
                                  <div className="text-sm font-medium">{p.name} {p.surname}</div>
                                  <div className="text-xs text-slate-500 truncate">{p.username}{p.phone ? ` · ${p.phone}` : ''}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {(!suggestions?.students?.length && !suggestions?.teachers?.length && !suggestions?.parents?.length) && (
                        <div className="p-4 text-sm text-slate-500">No suggestions</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>

            <button
              type="button"
              onClick={onMessagesOpen}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
              aria-label="Messages"
            >
              <Image src="/message.svg" alt="" width={16} height={16} className="filter invert brightness-125" />
              {messageCount > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-[1.05rem] items-center justify-center rounded-full bg-rose-400 px-1 text-[10px] font-semibold text-white">
                  {messageCount > 9 ? "9+" : messageCount}
                </span>
              ) : null}
            </button>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
              <NavbarAnnouncementBell initialCount={0} />
            </div>

            {role === "admin" && (
              <Link href="/list/settings" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white md:flex" aria-label="Settings">
                <Image src="/setting.svg" alt="Settings" width={16} height={16} className="filter invert brightness-125" />
              </Link>
            )}

            <div className="hidden min-w-0 max-w-40 flex-col text-right xl:flex">
              <span className="truncate text-sm font-medium text-slate-100">{user?.username || customUser?.username || displayName}</span>
              <span className="truncate text-xs capitalize text-slate-400">{displayRole}</span>
            </div>

            {role === "parent" && studentProfiles.length > 0 ? (
              <div className="relative" ref={studentMenuRef}>
                <button
                  type="button"
                  onClick={() => setStudentMenuOpen((prev) => !prev)}
                  aria-expanded={studentMenuOpen}
                  aria-label="View children"
                  className="flex items-center gap-1 rounded-full"
                >
                  {studentProfiles.slice(0, 3).map((student, index) => (
                    <div key={index} className="overflow-hidden rounded-full border-2 border-white/30">
                      <Image
                        src={student.img}
                        alt={`${student.name} ${student.surname}`}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    </div>
                  ))}
                  {studentProfiles.length > 3 && (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/40 text-white text-xs font-semibold">
                      +{studentProfiles.length - 3}
                    </div>
                  )}
                </button>

                <div className={`absolute right-0 top-full z-50 mt-3 min-w-[220px] overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-950 p-3 text-left text-sm text-white shadow-2xl backdrop-blur-xl transition-all duration-150 ${studentMenuOpen ? "block" : "hidden"}`}>
                  <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-400">Children</div>
                  <div className="space-y-2">
                    {studentProfiles.map((student, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-xl bg-slate-800/40 px-2 py-2">
                        <div className="overflow-hidden rounded-full border border-slate-700/40">
                          <Image
                            src={student.img}
                            alt={`${student.name} ${student.surname}`}
                            width={34}
                            height={34}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{student.name} {student.surname}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : user ? (
              <div className="shrink-0 rounded-full ring-1 ring-white/10">
                <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
              </div>
            ) : (
              <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white shadow-sm" aria-label="Open profile">
                {(customUser?.username || "U").slice(0, 1).toUpperCase()}
              </Link>
            )}

            <div className="md:hidden relative">
              <button
                type="button"
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/40 text-white shadow-sm hover:bg-slate-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="sr-only">Toggle menu</span>
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="20" height="2" rx="1" fill="currentColor" />
                  <rect y="6" width="20" height="2" rx="1" fill="currentColor" />
                  <rect y="12" width="20" height="2" rx="1" fill="currentColor" />
                </svg>
              </button>

              <div
                id="mobile-navigation"
                className={`absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-xl bg-slate-950 shadow-lg ring-1 ring-slate-700 transition-all duration-200 ${
                  mobileOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                <nav className="flex flex-col p-2" aria-label="Mobile navigation">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleMobileLink}
                      aria-current={item.active ? "page" : undefined}
                      className={`rounded-xl px-3 py-2 text-sm transition duration-150 ${
                        item.active
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      {role === "admin" ? (
        <nav
          aria-label="Admin navigation"
          className="hidden border-t border-white/10 bg-white md:block"
        >
          <div className="mx-auto flex min-h-12 max-w-screen-2xl items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
            <span className="mr-2 hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 xl:inline">
              Workspace
            </span>
            {adminDesktopItems.map((item) => {
              const active = item.href === "/admin"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${
                    active
                      ? "bg-sky-50 text-sky-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  {item.label}
                  {active ? <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-sky-600" aria-hidden="true" /> : null}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

    </>
  );
};

export default Navbar;
