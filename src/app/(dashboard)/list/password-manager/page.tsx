import PasswordManagerTable from '@/components/password-manager/PasswordManagerTable';
import Pagination from '@/components/Pagination';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { ITEM_PER_PAGE } from '@/lib/settings';

type PasswordManagerItem = {
  id: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  username: string;
  displayName: string;
  email: string | null;
};

const roleOptions = ['admin', 'teacher', 'parent', 'student'] as const;

export default async function PasswordManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== 'admin') {
    return <div className="bg-white p-4 rounded-md m-4">Unauthorized</div>;
  }

  const params = await searchParams;
  const search = params.search?.trim() ?? '';
  const roleFilter = roleOptions.includes(params.role as any) ? (params.role as typeof roleOptions[number]) : '';
  const sort = params.sort === 'role' || params.sort === 'displayName' ? params.sort : 'username';
  const direction = params.direction === 'desc' ? 'desc' : 'asc';
  const page = params.page ? parseInt(params.page, 10) || 1 : 1;

  const [admins, teachers, parents, students] = await prisma.$transaction([
    prisma.admin.findMany({ select: { id: true, username: true } }),
    prisma.teacher.findMany({ select: { id: true, username: true, name: true, surname: true, email: true } }),
    prisma.parent.findMany({ select: { id: true, username: true, name: true, surname: true, email: true } }),
    prisma.student.findMany({ select: { id: true, username: true, name: true, surname: true, email: true } }),
  ]);

  const allUsers: PasswordManagerItem[] = [
    ...admins.map((item) => ({
      id: item.id,
      role: 'admin' as const,
      username: item.username,
      displayName: item.username,
      email: null,
    })),
    ...teachers.map((item) => ({
      id: item.id,
      role: 'teacher' as const,
      username: item.username,
      displayName: `${item.name} ${item.surname}`,
      email: item.email,
    })),
    ...parents.map((item) => ({
      id: item.id,
      role: 'parent' as const,
      username: item.username,
      displayName: `${item.name} ${item.surname}`,
      email: item.email,
    })),
    ...students.map((item) => ({
      id: item.id,
      role: 'student' as const,
      username: item.username,
      displayName: `${item.name} ${item.surname}`,
      email: item.email,
    })),
  ];

  const filteredUsers = allUsers.filter((item) => {
    const normalizedQuery = search.toLowerCase();
    const matchesSearch =
      !normalizedQuery ||
      item.username.toLowerCase().includes(normalizedQuery) ||
      item.displayName.toLowerCase().includes(normalizedQuery) ||
      (item.email?.toLowerCase().includes(normalizedQuery) ?? false) ||
      item.role.toLowerCase().includes(normalizedQuery);
    const matchesRole = !roleFilter || item.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    const compare = (key: 'username' | 'displayName' | 'role') => {
      const first = a[key]?.toString().toLowerCase() ?? '';
      const second = b[key]?.toString().toLowerCase() ?? '';
      if (first < second) return -1;
      if (first > second) return 1;
      return 0;
    };

    const result = compare(sort as 'username' | 'displayName' | 'role');
    return direction === 'desc' ? -result : result;
  });

  const totalCount = sortedUsers.length;
  const pageItems = sortedUsers.slice(ITEM_PER_PAGE * (page - 1), ITEM_PER_PAGE * page);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Password Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all user credentials with search, filter, sorting, pagination, and leave blank to keep current password.</p>
        </div>
      </div>

      <PasswordManagerTable
        items={pageItems}
        currentSearch={search}
        currentRole={roleFilter}
        currentSort={sort as 'username' | 'displayName' | 'role'}
        currentDirection={direction}
        totalCount={totalCount}
      />
      <div className="mt-4">
        <Pagination page={page} count={totalCount} />
      </div>
    </div>
  );
}
