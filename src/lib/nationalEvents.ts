export type NationalEvent = {
  id: string;
  title: string;
  date: string;
  description: string;
  countryCode: string;
};

export type CalendarEventEntry = {
  id: number | string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: "school" | "national";
};

type FixedHoliday = {
  month: number;
  day: number;
  title: string;
  description: string;
  slug: string;
};

const GHANA_FIXED_HOLIDAYS: FixedHoliday[] = [
  {
    month: 1,
    day: 1,
    title: "New Year's Day",
    description: "Statutory public holiday",
    slug: "new-year",
  },
  {
    month: 1,
    day: 7,
    title: "Constitution Day",
    description: "Statutory public holiday",
    slug: "constitution-day",
  },
  {
    month: 3,
    day: 6,
    title: "Independence Day",
    description: "Ghana Independence Day — statutory public holiday",
    slug: "independence-day",
  },
  {
    month: 5,
    day: 1,
    title: "Workers' Day",
    description: "Labour Day — statutory public holiday",
    slug: "workers-day",
  },
  {
    month: 8,
    day: 4,
    title: "Founders' Day",
    description: "Statutory public holiday",
    slug: "founders-day",
  },
  {
    month: 9,
    day: 21,
    title: "Kwame Nkrumah Memorial Day",
    description: "Statutory public holiday",
    slug: "nkrumah-memorial-day",
  },
  {
    month: 12,
    day: 25,
    title: "Christmas Day",
    description: "Statutory public holiday",
    slug: "christmas",
  },
  {
    month: 12,
    day: 26,
    title: "Boxing Day",
    description: "Statutory public holiday",
    slug: "boxing-day",
  },
];

/** Movable Islamic feasts — dates announced annually by the Chief Imam. */
const GHANA_EID_DATES: Record<number, { fitr?: string; adha?: string }> = {
  2024: { fitr: "2024-04-10", adha: "2024-06-17" },
  2025: { fitr: "2025-03-31", adha: "2025-06-07" },
  2026: { fitr: "2026-03-21", adha: "2026-05-27" },
  2027: { fitr: "2027-03-10", adha: "2027-05-17" },
  2028: { fitr: "2028-02-27", adha: "2028-05-05" },
};

/** Substitute / observed dates declared for specific years. */
const GHANA_YEAR_OVERRIDES: Record<
  number,
  { date: string; title: string; description: string; slug: string }[]
> = {
  2025: [
    {
      date: "2025-01-10",
      title: "Constitution Day (Observed)",
      description: "Substitute public holiday",
      slug: "constitution-day-observed",
    },
    {
      date: "2025-07-03",
      title: "Republic Day (Observed)",
      description: "Substitute public holiday",
      slug: "republic-day-observed",
    },
  ],
  2026: [
    {
      date: "2026-01-09",
      title: "Constitution Day (Observed)",
      description: "Substitute public holiday",
      slug: "constitution-day-observed",
    },
    {
      date: "2026-07-03",
      title: "Republic Day (Observed)",
      description: "Substitute public holiday",
      slug: "republic-day-observed",
    },
    {
      date: "2026-12-28",
      title: "Boxing Day (Observed)",
      description: "Substitute public holiday",
      slug: "boxing-day-observed",
    },
  ],
};

const COMMEMORATIVE_DAYS: FixedHoliday[] = [
  {
    month: 5,
    day: 25,
    title: "African Union Day",
    description: "Commemorative day (not a public holiday)",
    slug: "au-day",
  },
  {
    month: 7,
    day: 1,
    title: "Republic Day",
    description: "Commemorative day",
    slug: "republic-day",
  },
];

function padDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function firstFridayOfDecember(year: number): Date {
  const date = new Date(year, 11, 1);
  while (date.getDay() !== 5) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function toNationalEvent(
  countryCode: string,
  date: string,
  title: string,
  description: string,
  slug: string
): NationalEvent {
  return {
    id: `national-${countryCode.toLowerCase()}-${date}-${slug}`,
    title,
    date,
    description,
    countryCode,
  };
}

export function resolveCountryFromLocation(location?: string | null): string {
  if (!location) return "GH";

  const lower = location.toLowerCase();
  if (
    lower.includes("ghana") ||
    lower.includes("accra") ||
    lower.includes("kumasi") ||
    lower.includes("tamale") ||
    lower.includes("takoradi")
  ) {
    return "GH";
  }

  return "GH";
}

function buildGhanaEventsForYear(year: number): NationalEvent[] {
  const events: NationalEvent[] = [];
  const countryCode = "GH";

  for (const holiday of GHANA_FIXED_HOLIDAYS) {
    events.push(
      toNationalEvent(
        countryCode,
        padDate(year, holiday.month, holiday.day),
        holiday.title,
        holiday.description,
        holiday.slug
      )
    );
  }

  for (const day of COMMEMORATIVE_DAYS) {
    events.push(
      toNationalEvent(
        countryCode,
        padDate(year, day.month, day.day),
        day.title,
        day.description,
        day.slug
      )
    );
  }

  const easter = getEasterSunday(year);
  const goodFriday = addDays(easter, -2);
  const easterMonday = addDays(easter, 1);
  const farmersDay = firstFridayOfDecember(year);

  events.push(
    toNationalEvent(
      countryCode,
      padDate(year, goodFriday.getMonth() + 1, goodFriday.getDate()),
      "Good Friday",
      "Statutory public holiday",
      "good-friday"
    ),
    toNationalEvent(
      countryCode,
      padDate(year, easterMonday.getMonth() + 1, easterMonday.getDate()),
      "Easter Monday",
      "Statutory public holiday",
      "easter-monday"
    ),
    toNationalEvent(
      countryCode,
      padDate(year, farmersDay.getMonth() + 1, farmersDay.getDate()),
      "Farmers' Day",
      "Statutory public holiday",
      "farmers-day"
    )
  );

  const eid = GHANA_EID_DATES[year];
  if (eid?.fitr) {
    events.push(
      toNationalEvent(
        countryCode,
        eid.fitr,
        "Eid-ul-Fitr",
        "Statutory public holiday",
        "eid-fitr"
      )
    );
  }
  if (eid?.adha) {
    events.push(
      toNationalEvent(
        countryCode,
        eid.adha,
        "Eid-ul-Adha",
        "Statutory public holiday",
        "eid-adha"
      )
    );
  }

  for (const extra of GHANA_YEAR_OVERRIDES[year] ?? []) {
    events.push(
      toNationalEvent(
        countryCode,
        extra.date,
        extra.title,
        extra.description,
        extra.slug
      )
    );
  }

  return events;
}

export function getNationalEvents(
  startYear: number,
  endYear: number,
  countryCode = "GH"
): NationalEvent[] {
  if (countryCode !== "GH") return [];

  const events: NationalEvent[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    events.push(...buildGhanaEventsForYear(year));
  }
  return events;
}

export function getNationalEventsForDate(
  date: Date,
  countryCode = "GH"
): NationalEvent[] {
  const year = date.getFullYear();
  const key = padDate(year, date.getMonth() + 1, date.getDate());
  return getNationalEvents(year, year, countryCode).filter((e) => e.date === key);
}

export function nationalEventsToCalendarEntries(
  events: NationalEvent[]
): CalendarEventEntry[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startTime: `${event.date}T00:00:00`,
    endTime: `${event.date}T23:59:59`,
    type: "national" as const,
  }));
}

function eventDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function groupCalendarEventsByDate(
  events: CalendarEventEntry[]
): Record<string, CalendarEventEntry[]> {
  const grouped: Record<string, CalendarEventEntry[]> = {};

  for (const event of events) {
    const dateKey = eventDateKey(event.startTime);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => {
      if (a.type === b.type) return a.title.localeCompare(b.title);
      return a.type === "national" ? -1 : 1;
    });
  }

  return grouped;
}
