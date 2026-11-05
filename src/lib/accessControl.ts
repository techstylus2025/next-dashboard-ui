import prisma from "@/lib/prisma";

export type AccessRestriction = "ACCESS_DENIED" | "MAINTENANCE_MODE";

export async function getAccessRestriction(input: {
  userId?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
}): Promise<AccessRestriction | null> {
  const role = input.role?.toLowerCase() ?? "";
  if (role === "admin") return null;

  const identifiers = [...new Set([input.username, input.email]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value)))];
  const users = input.userId
    ? await prisma.$queryRaw<Array<{ username: string | null; email: string | null }>>`
        SELECT "username", "email"
        FROM "User"
        WHERE "id" = ${input.userId}
        LIMIT 1
      `
    : [];
  for (const value of [users[0]?.username, users[0]?.email]) {
    const normalized = value?.trim().toLowerCase();
    if (normalized && !identifiers.includes(normalized)) identifiers.push(normalized);
  }

  const [settings, deniedRoles, deniedUsers] = await Promise.all([
    prisma.$queryRaw<Array<{ maintenanceMode: boolean }>>`
      SELECT "maintenanceMode"
      FROM "AppAccessSettings"
      WHERE "id" = 1
      LIMIT 1
    `,
    role
      ? prisma.$queryRaw<Array<{ role: string }>>`
          SELECT "role"
          FROM "AccessDeniedRole"
          WHERE "role" = ${role}
          LIMIT 1
        `
      : Promise.resolve([]),
    Promise.all(identifiers.map((identifier) => prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "AccessDeniedUser"
      WHERE lower("identifier") = ${identifier}
      LIMIT 1
    `)),
  ]);

  if (deniedRoles.length || deniedUsers.some((matches) => matches.length > 0)) {
    return "ACCESS_DENIED";
  }
  if (settings[0]?.maintenanceMode) return "MAINTENANCE_MODE";
  return null;
}

export async function loadAccessControlSettings() {
  const [settings, roles, users] = await Promise.all([
    prisma.$queryRaw<Array<{ maintenanceMode: boolean }>>`
      SELECT "maintenanceMode"
      FROM "AppAccessSettings"
      WHERE "id" = 1
      LIMIT 1
    `,
    prisma.$queryRaw<Array<{ role: string }>>`
      SELECT "role"
      FROM "AccessDeniedRole"
      ORDER BY "role"
    `,
    prisma.$queryRaw<Array<{ id: string; identifier: string; createdAt: Date }>>`
      SELECT "id", "identifier", "createdAt"
      FROM "AccessDeniedUser"
      ORDER BY "createdAt" DESC
    `,
  ]);

  return {
    maintenanceMode: settings[0]?.maintenanceMode ?? false,
    deniedRoles: roles.map((item) => item.role),
    deniedUsers: users,
  };
}
