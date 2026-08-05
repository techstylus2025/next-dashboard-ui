export function getRoleRedirectPath(clientRole?: string | null, serverRole?: string | null): string {
  const role = serverRole || clientRole;
  return role ? `/${role}` : "/admin";
}
