export type PasswordManagerRole = "admin" | "teacher" | "parent" | "student";

export type RoleTransitionResult = {
  shouldMigrate: boolean;
  targetRole: PasswordManagerRole;
  createPayload: Record<string, unknown> | null;
};

export function normalizePasswordManagerRole(value?: string | null): PasswordManagerRole | null {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "admin" || normalized === "teacher" || normalized === "parent" || normalized === "student") {
    return normalized;
  }

  return null;
}

export function buildRoleTransition(
  currentRole: string | null | undefined,
  nextRole: string | null | undefined,
  userRecord?: Record<string, any> | null
): RoleTransitionResult {
  const normalizedCurrent = normalizePasswordManagerRole(currentRole);
  const normalizedNext = normalizePasswordManagerRole(nextRole);

  if (!normalizedNext) {
    return {
      shouldMigrate: false,
      targetRole: normalizedCurrent ?? "admin",
      createPayload: null,
    };
  }

  const targetRole = normalizedNext;

  if (!normalizedCurrent || normalizedCurrent === normalizedNext) {
    return {
      shouldMigrate: false,
      targetRole,
      createPayload: null,
    };
  }

  const baseUser = userRecord ?? {};
  const payloadMap: Record<PasswordManagerRole, Record<string, unknown>> = {
    admin: {
      id: baseUser.id,
      username: baseUser.username ?? "",
    },
    teacher: {
      id: baseUser.id,
      username: baseUser.username ?? "",
      name: baseUser.name ?? "",
      surname: baseUser.surname ?? "",
      email: baseUser.email ?? null,
      phone: baseUser.phone ?? null,
      address: baseUser.address ?? "",
      img: baseUser.img ?? null,
      bloodType: baseUser.bloodType ?? "A+",
      sex: baseUser.sex ?? "MALE",
      birthday: baseUser.birthday ?? new Date(),
    },
    parent: {
      id: baseUser.id,
      username: baseUser.username ?? "",
      name: baseUser.name ?? "",
      surname: baseUser.surname ?? "",
      email: baseUser.email ?? null,
      occupation: baseUser.occupation ?? null,
      phone: baseUser.phone ?? "",
      address: baseUser.address ?? "",
    },
    student: {
      id: baseUser.id,
      username: baseUser.username ?? "",
      name: baseUser.name ?? "",
      surname: baseUser.surname ?? "",
      otherNames: baseUser.otherNames ?? null,
      nationality: baseUser.nationality ?? null,
      religion: baseUser.religion ?? null,
      address: baseUser.address ?? "",
      gpsAddress: baseUser.gpsAddress ?? null,
      languagesSpoken: baseUser.languagesSpoken ?? null,
      img: baseUser.img ?? null,
      bloodType: baseUser.bloodType ?? "A+",
      email: baseUser.email ?? null,
      phone: baseUser.phone ?? null,
      sex: baseUser.sex ?? "MALE",
      department: baseUser.department ?? null,
      createdAt: baseUser.createdAt ?? new Date(),
      parentId: baseUser.parentId ?? "",
      classId: baseUser.classId ?? 1,
      gradeId: baseUser.gradeId ?? 1,
      birthday: baseUser.birthday ?? new Date(),
      isArchived: baseUser.isArchived ?? false,
      archivedAt: baseUser.archivedAt ?? null,
    },
  };

  return {
    shouldMigrate: true,
    targetRole,
    createPayload: payloadMap[targetRole],
  };
}
