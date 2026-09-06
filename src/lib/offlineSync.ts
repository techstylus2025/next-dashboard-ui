/**
 * Offline sync service
 * Handles caching data to IndexedDB and retrieving from cache
 */

import {
  getAllOfflineData,
  saveOfflineData,
  clearOfflineStore,
  updateLastSyncTime,
  getLastSyncTime,
  OfflineDataType,
} from "@/lib/offlineDb";
import { shouldUseOfflineCache, isOnline } from "@/lib/offlineStatus";
import type {
  ResultsPageContext,
  TermlyReportRow,
} from "@/lib/resultsData";

/**
 * Sync results data to offline cache
 */
export async function cacheResultsData(data: ResultsPageContext): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  try {
    // Cache individual reports
    if (data.reports.length > 0) {
      await saveOfflineData("termlyReports", data.reports);
      await updateLastSyncTime("termlyReports");
    }

    // Cache classes
    if (data.classes.length > 0) {
      await saveOfflineData("classes", data.classes);
      await updateLastSyncTime("classes");
    }

    // Cache academic years
    if (data.academicYears.length > 0) {
      await saveOfflineData("academicYears", data.academicYears);
      await updateLastSyncTime("academicYears");
    }

    // Cache school settings
    if (data.schoolSettings) {
      await saveOfflineData("schoolSettings", {
        id: "default",
        ...data.schoolSettings,
      });
      await updateLastSyncTime("schoolSettings");
    }
  } catch (error) {
    console.error("Failed to cache results data:", error);
  }
}

/**
 * Get cached results data
 */
export async function getCachedResultsData(): Promise<Partial<ResultsPageContext> | null> {
  try {
    const [reports, classes, academicYears, schoolSettings] = await Promise.all([
      getAllOfflineData<TermlyReportRow>("termlyReports"),
      getAllOfflineData<any>("classes"),
      getAllOfflineData<any>("academicYears"),
      getAllOfflineData<any>("schoolSettings"),
    ]);

    if (reports.length === 0 && classes.length === 0) {
      return null; // No cache available
    }

    return {
      reports,
      classes,
      academicYears,
      schoolSettings: schoolSettings[0] || null,
    };
  } catch (error) {
    console.error("Failed to get cached results data:", error);
    return null;
  }
}

/**
 * Load data with fallback to cache if offline
 */
export async function loadDataWithOfflineFallback<T>(
  fetchFn: () => Promise<T>,
  cacheKey: OfflineDataType,
  cacheAllData?: () => Promise<void>
): Promise<T | null> {
  try {
    // If online, fetch fresh data and cache it
    if (isOnline()) {
      try {
        const data = await fetchFn();
        // Cache the fresh data in the background
        if (cacheAllData) {
          void cacheAllData();
        }
        return data;
      } catch (error) {
        console.error("Fetch failed, trying cache:", error);
        // Fall through to cache lookup
      }
    }

    // Try to get from cache
    const cachedData = await getAllOfflineData<T>(cacheKey);
    if (cachedData.length > 0) {
      console.log(`Using cached ${cacheKey} (${cachedData.length} items)`);
      return cachedData as unknown as T;
    }

    // If offline and no cache, return null
    if (!isOnline()) {
      console.warn(`No cached data available for ${cacheKey}`);
      return null;
    }

    return null;
  } catch (error) {
    console.error(`Error loading data for ${cacheKey}:`, error);
    return null;
  }
}

/**
 * Clear all cached data (used for logout or manual refresh)
 */
export async function clearAllCachedData(): Promise<void> {
  const stores: OfflineDataType[] = [
    "termlyReports",
    "classes",
    "academicYears",
    "schoolSettings",
  ];

  for (const store of stores) {
    await clearOfflineStore(store);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  lastSyncTimes: Record<string, number | null>;
  sizes: Record<string, number>;
}> {
  const stores: OfflineDataType[] = [
    "termlyReports",
    "classes",
    "academicYears",
    "schoolSettings",
  ];

  const lastSyncTimes: Record<string, number | null> = {};
  const sizes: Record<string, number> = {};

  for (const store of stores) {
    lastSyncTimes[store] = await getLastSyncTime(store);
    const data = await getAllOfflineData(store);
    sizes[store] = data.length;
  }

  return { lastSyncTimes, sizes };
}
