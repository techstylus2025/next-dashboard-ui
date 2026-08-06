export function normalizeRole(role?: string | null): string | null {
  if (!role || typeof role !== "string") {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  if (normalized === "admin" || normalized === "teacher" || normalized === "student" || normalized === "parent") {
    return normalized;
  }

  return null;
}

export function getRoleRedirectPath(clientRole?: string | null, serverRole?: string | null): string {
  const role = normalizeRole(serverRole) ?? normalizeRole(clientRole);
  return role ? `/${role}` : "/admin";
}
