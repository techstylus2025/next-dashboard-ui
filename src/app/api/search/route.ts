import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { redisGet, redisSet, redisAvailable } from "@/lib/redis";

const USE_PG_FULLTEXT = process.env.USE_PG_FULLTEXT === "1" || process.env.ENABLE_PG_FULLTEXT === "1";

// Simple in-memory cache for hot queries (per server instance)
type CacheEntry = { ts: number; value: any; ttl: number };
const searchCache: Map<string, CacheEntry> = (globalThis as any).__searchCache || new Map();
(globalThis as any).__searchCache = searchCache;

const cacheKey = (params: URLSearchParams) => {
  return [params.get("q"), params.get("userId"), params.get("role"), params.get("category"), params.get("skip"), params.get("take"), params.get("suggest")].join("|");
};

const nowTs = () => Date.now();

function scoreTextMatch(text: string, q: string) {
  if (!text) return 0;
  const t = text.toLowerCase();
  const ql = q.toLowerCase();
  if (t === ql) return 100;
  if (t.startsWith(ql)) return 60;
  if (t.includes(ql)) return 20;
  // token match bonus
  const tokens = ql.split(/\s+/).filter(Boolean);
  let tokScore = 0;
  for (const tok of tokens) {
    if (t.includes(tok)) tokScore += 5;
  }
  return tokScore;
}

// Score an object by checking key fields
function scoreItem(item: any, q: string, keys: string[]) {
  let s = 0;
  for (const k of keys) {
    if (!item[k]) continue;
    s = Math.max(s, scoreTextMatch(String(item[k]), q));
  }
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const userId = url.searchParams.get("userId");
  const role = url.searchParams.get("role");
  const suggest = url.searchParams.get("suggest") === "1";

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Query (q) is required" }, { status: 400 });
  }

  const qTrim = q.trim();
  const qFilter = { contains: qTrim, mode: "insensitive" } as any;
  try {
    const category = new URL(req.url).searchParams.get("category");
    const skip = Number(new URL(req.url).searchParams.get("skip") || 0);
    const takeParam = new URL(req.url).searchParams.get("take");
    const take = takeParam ? Number(takeParam) : suggest ? 5 : 8;

    // caching: short TTL for suggestions, longer for full searches
    const params = new URL(req.url).searchParams;
    const key = cacheKey(params);
    const ttl = suggest ? 5_000 : 30_000;

    // Try Redis first (cross-process cache)
    if (redisAvailable()) {
      try {
        const cachedRedis = await redisGet(`search:${key}`);
        if (cachedRedis) return NextResponse.json(cachedRedis);
      } catch (e) {
        // ignore redis failures
      }
    }

    // Fallback to in-memory cache
    const cached = searchCache.get(key);
    if (cached && nowTs() - cached.ts < cached.ttl) {
      return NextResponse.json(cached.value);
    }

    // Permission-aware filters
    let allowedStudentIds: string[] | null = null;
    let allowedClassIds: number[] | null = null;

    if (userId && role) {
      if (role === "parent") {
        const myStudents = await prisma.student.findMany({ where: { parentId: userId }, select: { id: true, classId: true } });
        allowedStudentIds = myStudents.map((s) => s.id);
        allowedClassIds = Array.from(new Set(myStudents.map((s) => s.classId)));
      } else if (role === "teacher") {
        const teacher = await prisma.teacher.findUnique({ where: { id: userId }, include: { classes: true } });
        if (teacher) {
          allowedClassIds = teacher.classes?.map((c) => c.id) || [];
        }
      }
    }

    const runStudents = async () => {
      // Prefer Postgres full-text search when enabled
      if (USE_PG_FULLTEXT) {
        try {
          const rows: any = await prisma.$queryRaw`
            SELECT id, name, surname, username, email, img
            FROM "Student"
            WHERE search_vector @@ plainto_tsquery('english', ${qTrim})
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${qTrim})) DESC
            LIMIT ${Math.max(50, take)}
          `;
          return rows;
        } catch (e) {
          // fall through to prisma findMany
        }
      }

      const where: any = {
        OR: [{ name: qFilter }, { surname: qFilter }, { username: qFilter }, { email: qFilter }],
      };
      if (allowedStudentIds) where.AND = [{ id: { in: allowedStudentIds } }];
      if (allowedClassIds && allowedClassIds.length > 0 && !allowedStudentIds) {
        where.AND = [{ classId: { in: allowedClassIds } }];
      }
      const items = await prisma.student.findMany({ where, select: { id: true, name: true, surname: true, username: true, email: true, img: true }, skip, take: Math.max(50, take) });
      // rank in JS for better relevance
      items.sort((a: any, b: any) => scoreItem(b, qTrim, ["name", "surname", "username", "email"]) - scoreItem(a, qTrim, ["name", "surname", "username", "email"]));
      return items.slice(0, take);
    };

    const runTeachers = async () => {
      if (USE_PG_FULLTEXT) {
        try {
          const rows: any = await prisma.$queryRaw`
            SELECT id, name, surname, username, email, img
            FROM "Teacher"
            WHERE search_vector @@ plainto_tsquery('english', ${qTrim})
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${qTrim})) DESC
            LIMIT ${Math.max(50, take)}
          `;
          return rows;
        } catch (e) {
          // fallback
        }
      }
      const items = await prisma.teacher.findMany({ where: { OR: [{ name: qFilter }, { surname: qFilter }, { username: qFilter }, { email: qFilter }] }, select: { id: true, name: true, surname: true, username: true, email: true, img: true }, skip, take: Math.max(50, take) });
      items.sort((a: any, b: any) => scoreItem(b, qTrim, ["name", "surname", "username", "email"]) - scoreItem(a, qTrim, ["name", "surname", "username", "email"]));
      return items.slice(0, take);
    };

    const runParents = async () => {
      if (USE_PG_FULLTEXT) {
        try {
          const rows: any = await prisma.$queryRaw`
            SELECT id, name, surname, username, email, phone
            FROM "Parent"
            WHERE search_vector @@ plainto_tsquery('english', ${qTrim})
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${qTrim})) DESC
            LIMIT ${Math.max(50, take)}
          `;
          // If role=parent scope to own id
          if (role === "parent" && userId) return rows.filter((r: any) => r.id === userId);
          return rows;
        } catch (e) {
          // fallback
        }
      }
      const where: any = { OR: [{ name: qFilter }, { surname: qFilter }, { username: qFilter }, { phone: qFilter }, { email: qFilter }] };
      if (role === "parent" && userId) {
        where.AND = [{ id: userId }];
      }
      const items = await prisma.parent.findMany({ where, select: { id: true, name: true, surname: true, username: true, email: true, phone: true }, skip, take: Math.max(50, take) });
      items.sort((a: any, b: any) => scoreItem(b, qTrim, ["name", "surname", "username", "email", "phone"]) - scoreItem(a, qTrim, ["name", "surname", "username", "email", "phone"]));
      return items.slice(0, take);
    };

    const runAnnouncements = async () => {
      if (USE_PG_FULLTEXT) {
        try {
          const rows: any = await prisma.$queryRaw`
            SELECT id, title, description, date
            FROM "Announcement"
            WHERE search_vector @@ plainto_tsquery('english', ${qTrim})
            ${allowedClassIds && allowedClassIds.length > 0 ? prisma.$queryRaw`AND classId IN (${allowedClassIds})` : ''}
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${qTrim})) DESC
            LIMIT ${Math.max(50, take)}
          `;
          return rows;
        } catch (e) {
          // fallback
        }
      }
      const where: any = { OR: [{ title: qFilter }, { description: qFilter }] };
      if (allowedClassIds && allowedClassIds.length > 0) where.AND = [{ classId: { in: allowedClassIds } }];
      const items = await prisma.announcement.findMany({ where, select: { id: true, title: true, description: true, date: true }, skip, take: Math.max(50, take) });
      items.sort((a: any, b: any) => scoreItem(b, qTrim, ["title", "description"]) - scoreItem(a, qTrim, ["title", "description"]));
      return items.slice(0, take);
    };

    const runClasses = async () => {
      if (USE_PG_FULLTEXT) {
        try {
          const rows: any = await prisma.$queryRaw`
            SELECT id, name
            FROM "Class"
            WHERE search_vector @@ plainto_tsquery('english', ${qTrim})
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${qTrim})) DESC
            LIMIT ${Math.max(50, take)}
          `;
          return rows;
        } catch (e) {
          // fallback
        }
      }
      const where: any = { OR: [{ name: qFilter }] };
      if (allowedClassIds && allowedClassIds.length > 0) where.AND = [{ id: { in: allowedClassIds } }];
      const items = await prisma.class.findMany({ where, select: { id: true, name: true }, skip, take: Math.max(50, take) });
      items.sort((a: any, b: any) => scoreItem(b, qTrim, ["name"]) - scoreItem(a, qTrim, ["name"]));
      return items.slice(0, take);
    };

    const runBooks = async () => {
      if (USE_PG_FULLTEXT) {
        try {
          const rows: any = await prisma.$queryRaw`
            SELECT id, title, supplierName
            FROM "Book"
            WHERE search_vector @@ plainto_tsquery('english', ${qTrim})
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${qTrim})) DESC
            LIMIT ${Math.max(50, take)}
          `;
          return rows;
        } catch (e) {
          // fallback
        }
      }
      const items = await prisma.book.findMany({ where: { OR: [{ title: qFilter }, { supplierName: qFilter }] }, select: { id: true, title: true, supplierName: true }, skip, take: Math.max(50, take) });
      items.sort((a: any, b: any) => scoreItem(b, qTrim, ["title", "supplierName"]) - scoreItem(a, qTrim, ["title", "supplierName"]));
      return items.slice(0, take);
    };

    const runEvents = async () => {
      if (USE_PG_FULLTEXT) {
        try {
          const rows: any = await prisma.$queryRaw`
            SELECT id, title, description, startTime
            FROM "Event"
            WHERE search_vector @@ plainto_tsquery('english', ${qTrim})
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${qTrim})) DESC
            LIMIT ${Math.max(50, take)}
          `;
          return rows;
        } catch (e) {
          // fallback
        }
      }
      const items = await prisma.event.findMany({ where: { OR: [{ title: qFilter }, { description: qFilter }] }, select: { id: true, title: true, description: true, startTime: true }, skip, take: Math.max(50, take) });
      items.sort((a: any, b: any) => scoreItem(b, qTrim, ["title", "description"]) - scoreItem(a, qTrim, ["title", "description"]));
      return items.slice(0, take);
    };

    const runMessages = async () => {
      if (USE_PG_FULLTEXT) {
        try {
          const rows: any = await prisma.$queryRaw`
            SELECT id, text, senderId, recipientId, createdAt
            FROM "Message"
            WHERE search_vector @@ plainto_tsquery('english', ${qTrim})
            ${userId ? prisma.$queryRaw`AND (senderId = ${userId} OR recipientId = ${userId})` : ''}
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${qTrim})) DESC
            LIMIT ${Math.max(50, suggest ? Math.min(6, take) : Math.min(12, take))}
          `;
          return rows;
        } catch (e) {
          // fallback
        }
      }
      const where: any = { text: qFilter };
      if (userId) where.AND = [{ OR: [{ senderId: userId }, { recipientId: userId }] }];
      const items = await prisma.message.findMany({ where, select: { id: true, text: true, senderId: true, recipientId: true, createdAt: true }, skip, take: Math.max(50, suggest ? Math.min(6, take) : Math.min(12, take)) });
      items.sort((a: any, b: any) => scoreItem(b, qTrim, ["text"]) - scoreItem(a, qTrim, ["text"]));
      return items.slice(0, suggest ? Math.min(6, take) : Math.min(12, take));
    };

    if (category) {
      let payload: any;
      switch (category) {
        case "students":
          payload = { category: "students", items: await runStudents() };
          break;
        case "teachers":
          payload = { category: "teachers", items: await runTeachers() };
          break;
        case "parents":
          payload = { category: "parents", items: await runParents() };
          break;
        case "announcements":
          payload = { category: "announcements", items: await runAnnouncements() };
          break;
        case "classes":
          payload = { category: "classes", items: await runClasses() };
          break;
        case "books":
          payload = { category: "books", items: await runBooks() };
          break;
        case "events":
          payload = { category: "events", items: await runEvents() };
          break;
        case "messages":
          payload = { category: "messages", items: await runMessages() };
          break;
        default:
          payload = { category: "unknown", items: [] };
      }
      // set cross-process cache
      try {
        if (redisAvailable()) await redisSet(`search:${key}`, payload, ttl);
      } catch (e) {}
      searchCache.set(key, { ts: nowTs(), value: payload, ttl });
      return NextResponse.json(payload);
    }

    const [students, teachers, parents, announcements, classes, books, events, messages] = await Promise.all([
      runStudents(),
      runTeachers(),
      runParents(),
      runAnnouncements(),
      runClasses(),
      runBooks(),
      runEvents(),
      runMessages(),
    ]);

    const result = { students, teachers, parents, announcements, classes, books, events, messages };
    try {
      if (redisAvailable()) await redisSet(`search:${key}`, result, ttl);
    } catch (e) {}
    searchCache.set(key, { ts: nowTs(), value: result, ttl });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Search error", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
