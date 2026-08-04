import Fuse from "fuse.js";

export type SearchSuggestionItem = {
  id: string;
  name?: string | null;
  surname?: string | null;
  username?: string | null;
  email?: string | null;
  img?: string | null;
  [key: string]: unknown;
};

export type SearchSuggestionGroups = {
  students: SearchSuggestionItem[];
  teachers: SearchSuggestionItem[];
  parents: SearchSuggestionItem[];
};

export function getSimilarityScore(text: string, query: string) {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (!normalizedQuery) return 1;
  if (normalizedText === normalizedQuery) return 1;
  if (normalizedText.includes(normalizedQuery)) return 0.95;

  const letters = normalizedQuery.split("").filter(Boolean);
  const matches = letters.filter((letter) => normalizedText.includes(letter)).length;
  const ratio = matches / Math.max(letters.length, 1);

  return Number(Math.max(ratio, 0).toFixed(2));
}

export function buildSuggestionGroups(
  data: Record<string, SearchSuggestionItem[]> | null,
  query: string,
  role?: string,
): SearchSuggestionGroups {
  const normalizedQuery = query.trim();
  const baseGroups: SearchSuggestionGroups = {
    students: [],
    teachers: [],
    parents: [],
  };

  if (!normalizedQuery) return baseGroups;

  const categories = role === "admin" ? ["students", "teachers"] : ["students", "teachers", "parents"];

  const groups: SearchSuggestionGroups = {
    students: [],
    teachers: [],
    parents: [],
  };

  categories.forEach((category) => {
    const items = Array.isArray(data?.[category]) ? (data[category] as SearchSuggestionItem[]) : [];
    if (!items.length) return;

    const limitedItems = items.slice(0, 8);
    if (limitedItems.length <= 6) {
      groups[category as keyof SearchSuggestionGroups] = limitedItems as SearchSuggestionItem[];
      return;
    }

    const fuse = new Fuse(limitedItems, {
      keys: ["name", "surname", "username", "email"],
      threshold: 0.38,
      ignoreLocation: true,
      distance: 80,
      includeScore: true,
      shouldSort: true,
    });

    const results = fuse.search(normalizedQuery, { limit: 6 });
    const scoredResults = results
      .map((result) => ({
        item: result.item,
        score: getSimilarityScore(`${result.item.name ?? ""} ${result.item.surname ?? ""}`.trim(), normalizedQuery),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    groups[category as keyof SearchSuggestionGroups] = scoredResults.map((entry) => entry.item) as SearchSuggestionItem[];
  });

  return groups;
}

export function flattenSuggestionGroups(groups: SearchSuggestionGroups) {
  return [
    ...groups.students.map((item) => ({ type: "students" as const, item })),
    ...groups.teachers.map((item) => ({ type: "teachers" as const, item })),
    ...groups.parents.map((item) => ({ type: "parents" as const, item })),
  ];
}
