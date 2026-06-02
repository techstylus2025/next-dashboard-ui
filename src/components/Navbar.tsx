"use client";

import NavbarAnnouncementBell from "@/components/NavbarAnnouncementBell";
import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from 'fuse.js';
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

const Navbar = ({ onMessagesOpen }: { onMessagesOpen?: () => void }) => {
  const { user } = useUser();
  const [messageCount, setMessageCount] = useState(0);
  const [supervisorClass, setSupervisorClass] = useState<string | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<string[] | null>(null);
  const [studentProfiles, setStudentProfiles] = useState<{
    img: string;
    name: string;
    surname: string;
  }[]>([]);

  const role = user?.publicMetadata?.role as string | undefined;
  const pathname = usePathname();
  const [now, setNow] = useState(new Date());
  const [academicPeriod, setAcademicPeriod] = useState<{
    badge: string;
    yearLabel: string | null;
    termNumber: number | null;
  }>({ badge: "", yearLabel: null, termNumber: null });

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
      if (!user?.id || !role) return;

      try {
        const res = await fetch(`/api/user/role-details?userId=${user.id}&role=${role}`, {
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
  }, [user?.id, role]);

  const displayName = user?.firstName || user?.username || "User";
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  const navItems = useMemo(() => {
    const baseItems =
      role === "admin"
        ? [
            { href: "/", label: "Dashboard" },
            { href: "/list/exams", label: "Exams" },
            { href: "/list/lessons", label: "Lessons" },
            { href: "/list/results", label: "Results" },
            { href: "/list/messages", label: "Messages" },
            { href: "/list/settings", label: "Settings" },
          ]
        : role === "teacher"
        ? [
            { href: "/", label: "Dashboard" },
            { href: "/list/exams", label: "Exams" },
            { href: "/list/lessons", label: "Lessons" },
            { href: "/list/messages", label: "Messages" },
          ]
        : role === "parent"
        ? [
            { href: "/", label: "Dashboard" },
            { href: "/list/exams", label: "Exams" },
            { href: "/list/results", label: "Results" },
          ]
        : [
            { href: "/", label: "Dashboard" },
            { href: "/list/exams", label: "Exams" },
            { href: "/list/results", label: "Results" },
          ];

    return baseItems.map((item) => ({
      ...item,
      active: pathname === item.href || pathname.startsWith(item.href + "/"),
    }));
  }, [role, pathname]);

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

  const breadcrumb = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    return segments
      .map((segment) =>
        segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (match) => match.toUpperCase())
      )
      .join(" / ");
  }, [pathname]);

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
        if (user?.id) params.set("userId", user.id);
        if (role) params.set("role", role);
        const res = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) return setSuggestions(null);
        const data = await res.json();
        setSuggestions(data);
        // small client-side fuzzy re-ranking/fallback using Fuse
        const flat: Array<{ type: string; item: any }> = [];
        if (data?.students) data.students.forEach((s: any) => flat.push({ type: 'students', item: s }));
        if (data?.teachers) data.teachers.forEach((t: any) => flat.push({ type: 'teachers', item: t }));
        if (data?.parents) data.parents.forEach((p: any) => flat.push({ type: 'parents', item: p }));
        // if server returned some but not many, use Fuse to produce stronger matches
        if (flat.length > 0) {
          const fuse = new Fuse(flat, { keys: ['item.name', 'item.surname', 'item.username', 'item.email'], threshold: 0.4 });
          const fuzzResults = fuse.search(searchQuery.trim(), { limit: Math.min(12, flat.length) });
          if (fuzzResults && fuzzResults.length > 0) {
            // reconstruct suggestions grouped
            const grouped: any = { students: [], teachers: [], parents: [] };
            fuzzResults.forEach((r: any) => grouped[r.item.type as string].push(r.item.item));
            setSuggestions(grouped);
            // rebuild flatSuggestions for keyboard nav
            const rebuilt: Array<{ type: string; item: any }> = [];
            if (grouped.students) grouped.students.forEach((s: any) => rebuilt.push({ type: 'students', item: s }));
            if (grouped.teachers) grouped.teachers.forEach((t: any) => rebuilt.push({ type: 'teachers', item: t }));
            if (grouped.parents) grouped.parents.forEach((p: any) => rebuilt.push({ type: 'parents', item: p }));
            flatSuggestions.current = rebuilt;
            setFocusedIndex(rebuilt.length > 0 ? 0 : -1);
            return;
          }
        }
        // build flat suggestions for keyboard nav
        const flat2: Array<{ type: string; item: any }> = [];
        if (data?.students) data.students.forEach((s: any) => flat2.push({ type: 'students', item: s }));
        if (data?.teachers) data.teachers.forEach((t: any) => flat2.push({ type: 'teachers', item: t }));
        if (data?.parents) data.parents.forEach((p: any) => flat2.push({ type: 'parents', item: p }));
        flatSuggestions.current = flat2;
        setFocusedIndex(flat2.length > 0 ? 0 : -1);
      } catch {
        setSuggestions(null);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchQuery, user?.id, role]);

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
    <header className="sticky top-0 z-40 inset-x-0 w-screen bg-slate-950">
      <div className="w-full min-w-full flex flex-nowrap items-center justify-between gap-3 overflow-visible rounded-none bg-slate-950 text-white px-4 py-2 sm:px-6 sm:py-3 shadow-[0_24px_55px_rgba(0,0,0,0.22)] ring-1 ring-slate-800/50 backdrop-blur-xl">
        {/* Left: logo + title + date/academic info (admin only) */}
        <div className="flex items-center gap-3">
          <Link href={"/"} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-800/40 flex items-center justify-center shadow-md backdrop-blur-sm">
              <Image src="/logo.svg" alt="logo" width={20} height={20} className="filter invert brightness-125" />
            </div>
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-md sm:text-sm font-semibold text-amber-400">School Management</span>
                    <span className="text-xs sm:text-xs text-slate-300">
                    {role === "admin" ? "Admin Dashboard" : role === "teacher" ? "Teacher Dashboard" : role === "parent" ? "Parent Dashboard" : role === "student" ? "Student Dashboard" : "Dashboard"}
                  </span>
                </div>
          </Link>

          {/* Admin: Date/Time and Academic Period (hidden on mobile) */}
          {role === "admin" && (
            <div className="hidden md:flex items-center gap-4 ml-4">
              {/* Date and Time */}
              <div className="flex flex-col text-xs text-slate-300">
                <span className="font-medium text-white">{formattedDate}</span>
                <span className="text-slate-300">{formattedTime}</span>
              </div>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-slate-600/40"></div>

              {/* Academic Year and Term */}
              <div className="flex flex-col text-xs text-slate-300">
                <span className="font-medium text-white">{activeAcademicLabel}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center: navigation links (desktop) - hidden for admin */}
        {role !== "admin" && (
          <nav className="hidden md:flex items-center gap-4" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`text-sm px-3 py-2 rounded-lg transition duration-150 ease-out ${
                  item.active
                    ? "bg-slate-800/70 text-white shadow-sm"
                    : "text-slate-300/80 hover:text-white hover:bg-slate-800/40 dark:text-slate-200/80 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <form onSubmit={onSearchSubmit} className="hidden md:flex relative items-center bg-slate-800/40 rounded-full px-2 py-1 gap-2">
            <button type="button" onClick={onSearchSubmit} className="pl-2 pr-1">
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
              className="w-40 md:w-56 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-400 dark:placeholder:text-white/60"
              aria-label="Global search"
            />

            {/* Suggestions dropdown */}
            {searchQuery.trim().length >= 2 && (
              <div role="listbox" aria-label="Search suggestions" aria-live="polite" className="absolute left-0 top-full z-50 mt-2 w-[22rem] max-w-[60vw] rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 fade-in">
                <div className="p-2">
                  <div className="text-xs text-slate-400 px-2 py-1">Suggestions</div>
                  <div className="max-h-64 overflow-auto">
                    {/* Students */}
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

                    {/* Teachers */}
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

                    {/* Parents */}
                    {suggestions?.parents?.length > 0 && (
                      <div className="px-2 py-1">
                        <div className="mb-1 text-xs text-slate-500">Parents</div>
                        {suggestions.parents.map((p: any) => {
                          const globalIndex = flatSuggestions.current.findIndex((f) => f.type === 'parents' && f.item.id === p.id);
                          const isFocused = globalIndex === focusedIndex;
                            return (
                            <button role="option" aria-selected={isFocused} key={p.id} onClick={() => { setSearchQuery(''); router.push(`/list/parents/${p.id}`); }} onMouseEnter={() => setFocusedIndex(globalIndex)} data-index={globalIndex} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${isFocused ? 'suggestion-focus' : ''}`}>
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

                    {/* Other categories fallback */}
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
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-slate-800/40 text-white hover:bg-slate-700/60 transition"
            aria-label="Messages"
          >
            <Image src="/message.svg" alt="" width={16} height={16} className="filter invert brightness-125" />
            {messageCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-4 min-w-[1.05rem] items-center justify-center rounded-full bg-rose-400 px-1 text-[10px] font-semibold text-white">
                {messageCount > 9 ? "9+" : messageCount}
              </span>
            ) : null}
          </button>

          <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-800/40 hover:bg-slate-700/60 transition">
            <NavbarAnnouncementBell initialCount={0} />
          </div>

          {role === "admin" && (
            <Link href="/list/settings" className="hidden md:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-slate-800/40 text-white hover:bg-slate-700/60 transition" aria-label="Settings">
              <Image src="/setting.svg" alt="Settings" width={16} height={16} className="filter invert brightness-125" />
            </Link>
          )}

          <div className="hidden sm:flex flex-col text-right min-w-0 max-w-[140px]">
            <span className="text-sm font-medium text-white truncate">{user?.username || displayName}</span>
            <span className="text-xs text-slate-300 dark:text-white/70 capitalize truncate">{displayRole}</span>
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
          ) : (
            <div className="rounded-full shadow-sm">
              <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
            </div>
          )}

          {/* Mobile: hamburger */}
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
              className={`absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl bg-slate-950 shadow-lg ring-1 ring-slate-700 transition-all duration-200 ${
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
  );
};

export default Navbar;
