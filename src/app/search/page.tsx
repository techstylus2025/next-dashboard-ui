import SearchClient from "@/components/SearchClient";

export const dynamic = "force-dynamic";

export default function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q ?? "";
  return <SearchClient initialQuery={q} />;
}
