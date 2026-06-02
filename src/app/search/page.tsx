"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type SearchResult = {
  students?: any[];
  teachers?: any[];
  parents?: any[];
  announcements?: any[];
  classes?: any[];
  books?: any[];
  events?: any[];
  messages?: any[];
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 8;
  const [skips, setSkips] = useState<{ [k: string]: number }>({});
  const [loadingMore, setLoadingMore] = useState<{ [k: string]: boolean }>({});

  useEffect(() => {
    if (!q) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || "Search failed");
        return res.json();
      })
      .then((data) => setResults(data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [q]);

  const loadMore = async (category: string) => {
    if (!q) return;
    setLoadingMore((s) => ({ ...s, [category]: true }));
    const currentSkip = skips[category] || PAGE_SIZE;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&skip=${currentSkip}&take=${PAGE_SIZE}`);
      if (!res.ok) throw new Error('Load failed');
      const payload = await res.json();
      const items = payload.items || [];
      setResults((r) => ({ ...(r || {}), [category]: [...((r as any)?.[category] || []), ...items] } as SearchResult));
      setSkips((s) => ({ ...s, [category]: currentSkip + items.length }));
    } catch (err) {
      // ignore for now
    } finally {
      setLoadingMore((s) => ({ ...s, [category]: false }));
    }
  };

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-yellow-100">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };


  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-md px-3 py-2 text-sm bg-slate-100">Back</button>
        <h1 className="text-xl font-semibold">Search results for "{q}"</h1>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Searching…</div>
      ) : error ? (
        <div className="text-sm text-rose-600">{error}</div>
      ) : results ? (
        <div className="space-y-6">
          {results.students && results.students.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium">Students</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {results.students.map((s: any) => (
                  <Link key={s.id} href={`/list/students/${s.id}`} className="block rounded-lg border p-3 hover:bg-slate-50 flex items-center gap-3">
                    {s.img ? (
                      <Image src={s.img} alt="avatar" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-slate-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{highlight(`${s.name} ${s.surname}`, q)}</div>
                      <div className="text-xs text-slate-500 truncate">{highlight(s.username || '', q)} {s.email ? <>· {highlight(s.email, q)}</> : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
              {results.students.length >= PAGE_SIZE && (
                <div className="mt-2">
                  <button disabled={loadingMore['students']} onClick={() => loadMore('students')} className="text-sm text-sky-600">{loadingMore['students'] ? 'Loading…' : 'Load more students'}</button>
                </div>
              )}
            </section>
          )}

          {results.teachers && results.teachers.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium">Teachers</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {results.teachers.map((t: any) => (
                  <Link key={t.id} href={`/list/teachers/${t.id}`} className="block rounded-lg border p-3 hover:bg-slate-50 flex items-center gap-3">
                    {t.img ? (
                      <Image src={t.img} alt="avatar" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-slate-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{highlight(`${t.name} ${t.surname}`, q)}</div>
                      <div className="text-xs text-slate-500 truncate">{highlight(t.username || '', q)} {t.email ? <>· {highlight(t.email, q)}</> : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
              {results.teachers.length >= PAGE_SIZE && (
                <div className="mt-2">
                  <button disabled={loadingMore['teachers']} onClick={() => loadMore('teachers')} className="text-sm text-sky-600">{loadingMore['teachers'] ? 'Loading…' : 'Load more teachers'}</button>
                </div>
              )}
            </section>
          )}

          {results.parents && results.parents.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium">Parents</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {results.parents.map((p: any) => (
                  <Link key={p.id} href={`/list/parents/${p.id}`} className="block rounded-lg border p-3 hover:bg-slate-50 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{highlight(`${p.name} ${p.surname}`, q)}</div>
                      <div className="text-xs text-slate-500 truncate">{highlight(p.username || '', q)} {p.phone ? <>· {highlight(p.phone, q)}</> : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
              {results.parents.length >= PAGE_SIZE && (
                <div className="mt-2">
                  <button disabled={loadingMore['parents']} onClick={() => loadMore('parents')} className="text-sm text-sky-600">{loadingMore['parents'] ? 'Loading…' : 'Load more parents'}</button>
                </div>
              )}
            </section>
          )}

          {results.announcements && results.announcements.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium">Announcements</h2>
              <div className="space-y-2">
                {results.announcements.map((a: any) => (
                  <Link key={a.id} href={`/list/announcements/${a.id}`} className="block rounded-lg border p-3 hover:bg-slate-50">
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-slate-500 truncate">{a.description}</div>
                  </Link>
                ))}
              </div>
              {results.announcements.length >= PAGE_SIZE && (
                <div className="mt-2">
                  <button disabled={loadingMore['announcements']} onClick={() => loadMore('announcements')} className="text-sm text-sky-600">{loadingMore['announcements'] ? 'Loading…' : 'Load more announcements'}</button>
                </div>
              )}
            </section>
          )}

          {results.classes && results.classes.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium">Classes</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {results.classes.map((c: any) => (
                  <Link key={c.id} href={`/list/classes/${c.id}`} className="block rounded-lg border p-3 hover:bg-slate-50">
                    <div className="font-semibold">{c.name}</div>
                  </Link>
                ))}
              </div>
              {results.classes.length >= PAGE_SIZE && (
                <div className="mt-2">
                  <button disabled={loadingMore['classes']} onClick={() => loadMore('classes')} className="text-sm text-sky-600">{loadingMore['classes'] ? 'Loading…' : 'Load more classes'}</button>
                </div>
              )}
            </section>
          )}

          {results.books && results.books.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium">Books</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {results.books.map((b: any) => (
                  <div key={b.id} className="block rounded-lg border p-3 hover:bg-slate-50">
                    <div className="font-semibold">{b.title}</div>
                    <div className="text-xs text-slate-500">{b.supplierName}</div>
                  </div>
                ))}
              </div>
              {results.books.length >= PAGE_SIZE && (
                <div className="mt-2">
                  <button disabled={loadingMore['books']} onClick={() => loadMore('books')} className="text-sm text-sky-600">{loadingMore['books'] ? 'Loading…' : 'Load more books'}</button>
                </div>
              )}
            </section>
          )}

          {results.events && results.events.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium">Events</h2>
              <div className="space-y-2">
                {results.events.map((e: any) => (
                  <div key={e.id} className="block rounded-lg border p-3 hover:bg-slate-50">
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-xs text-slate-500 truncate">{e.description}</div>
                  </div>
                ))}
              </div>
              {results.events.length >= PAGE_SIZE && (
                <div className="mt-2">
                  <button disabled={loadingMore['events']} onClick={() => loadMore('events')} className="text-sm text-sky-600">{loadingMore['events'] ? 'Loading…' : 'Load more events'}</button>
                </div>
              )}
            </section>
          )}

          {results.messages && results.messages.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-medium">Messages</h2>
              <div className="space-y-2">
                {results.messages.map((m: any) => (
                  <div key={m.id} className="block rounded-lg border p-3 hover:bg-slate-50">
                    <div className="text-sm text-slate-700 truncate">{m.text}</div>
                    <div className="text-xs text-slate-500">From: {m.senderId} · To: {m.recipientId}</div>
                  </div>
                ))}
              </div>
              {results.messages.length >= PAGE_SIZE && (
                <div className="mt-2">
                  <button disabled={loadingMore['messages']} onClick={() => loadMore('messages')} className="text-sm text-sky-600">{loadingMore['messages'] ? 'Loading…' : 'Load more messages'}</button>
                </div>
              )}
            </section>
          )}

        </div>
      ) : (
        <div className="text-sm text-slate-500">Enter a search query in the navbar to begin.</div>
      )}
    </div>
  );
}
