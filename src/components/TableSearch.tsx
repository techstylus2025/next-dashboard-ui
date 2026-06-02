"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const TableSearch = ({ initialValue }: { initialValue?: string }) => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const value = (e.currentTarget[0] as HTMLInputElement).value;

    const params = new URLSearchParams(window.location.search);
    params.set("search", value);
    router.push(`${window.location.pathname}?${params}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-slate-300 px-3 py-2 bg-white"
    >
      <Image src="/search.svg" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Search..."
        defaultValue={initialValue}
        className="w-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
    </form>
  );
};

export default TableSearch;
