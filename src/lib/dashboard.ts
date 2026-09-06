export type UserRole = "admin" | "teacher" | "student" | "parent";

export function getDashboardPath(
  role: string | undefined
): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  if (role === "parent") return "/parent";
  return "/admin";
}

export function isDashboardPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname === "/teacher" ||
    pathname === "/student" ||
    pathname === "/parent"
  );
}
