"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TableSearch from "@/components/TableSearch";
import { toast } from "react-toastify";

export type PasswordManagerItem = {
  id: string;
  role: "admin" | "teacher" | "parent" | "student";
  username: string;
  displayName: string;
  email: string | null;
};

type EditableRow = PasswordManagerItem & {
  editingUsername: string;
  editingRole: "admin" | "teacher" | "parent" | "student";
  newPassword: string;
  showPassword: boolean;
  saving: boolean;
};

const ROLE_OPTIONS: Array<"admin" | "teacher" | "parent" | "student"> = ["admin", "teacher", "parent", "student"];
const ROLES = ["", ...ROLE_OPTIONS] as const;
const SORT_OPTIONS = [
  { value: "username", label: "Username" },
  { value: "displayName", label: "Name" },
  { value: "role", label: "Role" },
] as const;

export default function PasswordManagerTable({
  items,
  currentSearch,
  currentRole,
  currentSort,
  currentDirection,
  totalCount,
}: {
  items: PasswordManagerItem[];
  currentSearch: string;
  currentRole: string;
  currentSort: "username" | "displayName" | "role";
  currentDirection: "asc" | "desc";
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<EditableRow[]>(
    items.map((item) => ({
      ...item,
      editingUsername: item.username,
      editingRole: item.role,
      newPassword: "",
      showPassword: false,
      saving: false,
    }))
  );

  useEffect(() => {
    setRows(
      items.map((item) => ({
        ...item,
        editingUsername: item.username,
        editingRole: item.role,
        newPassword: "",
        showPassword: false,
        saving: false,
      }))
    );
  }, [items]);

  const params = useMemo(() => {
    const entries = Array.from(searchParams.entries());
    return new URLSearchParams(entries);
  }, [searchParams]);

  const updateParam = (key: string, value: string) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const saveRow = async (id: string) => {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    if (!row.editingUsername.trim()) {
      toast.error("Username cannot be empty.");
      return;
    }
    setRows((prev) => prev.map((item) => (item.id === id ? { ...item, saving: true } : item)));

    try {
      const payload: Record<string, string> = {
        id,
        originalRole: row.role || row.editingRole,
        role: row.editingRole || row.role,
        username: row.editingUsername.trim() || row.username,
      };
      if (row.newPassword.trim()) {
        payload.password = row.newPassword.trim();
      }

      const response = await fetch("/api/password-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Unable to update credentials.");
      }

      setRows((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                username: row.editingUsername.trim(),
                role: row.editingRole,
                editingUsername: row.editingUsername.trim(),
                newPassword: "",
                saving: false,
              }
            : item
        )
      );
      toast.success("Credentials updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
      setRows((prev) => prev.map((item) => (item.id === id ? { ...item, saving: false } : item)));
    }
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-[220px]">
            <TableSearch initialValue={currentSearch} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {totalCount} user{totalCount === 1 ? '' : 's'} found
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Role</label>
            <select
              value={currentRole}
              onChange={(event) => updateParam('role', event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              {ROLES.map((option) => (
                <option key={option} value={option}>
                  {option === '' ? 'All roles' : option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Sort by</label>
            <select
              value={currentSort}
              onChange={(event) => updateParam('sort', event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700"
            onClick={() => updateParam('direction', currentDirection === 'asc' ? 'desc' : 'asc')}
          >
            {currentDirection === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
        <table className="min-w-full text-sm sm:text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500 text-xs uppercase tracking-[0.08em]">
              <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Username</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Password</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row) => {
              const isDirty = row.editingUsername !== row.username || row.newPassword.trim() !== '' || row.editingRole !== row.role;
              return (
                <tr
                  key={`${row.role}-${row.id}`}
                  className="border-b border-slate-200 even:bg-slate-50 hover:bg-slate-100"
                >
                  <td className="px-4 py-3 align-top text-slate-800">
                    <div className="font-semibold">{row.displayName}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={row.editingRole}
                      onChange={(event) =>
                        setRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, editingRole: event.target.value as EditableRow['editingRole'] } : item
                          )
                        )
                      }
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                      value={row.editingUsername}
                      onChange={(event) =>
                        setRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, editingUsername: event.target.value } : item
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="relative flex items-center gap-2">
                      <input
                        type={row.showPassword ? 'text' : 'password'}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                        value={row.newPassword}
                        onChange={(event) =>
                          setRows((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, newPassword: event.target.value } : item
                            )
                          )
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-1"
                        onClick={() =>
                          setRows((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, showPassword: !item.showPassword } : item
                            )
                          )
                        }
                      >
                        <Image src="/view.svg" alt="Toggle password visibility" width={18} height={18} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-slate-700">
                    {row.email || '-'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      disabled={!isDirty || row.saving}
                      onClick={() => saveRow(row.id)}
                      className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {row.saving ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
