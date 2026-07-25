/**
 * IndexedDB service for offline-first data caching
 * Stores reports, classes, academic years, and student data for offline access
 */

const DB_NAME = "SchoolManagementDB";
const DB_VERSION = 1;

// Store names
const STORES = {
  REPORTS: "termlyReports",
  CLASSES: "classes",
  ACADEMIC_YEARS: "academicYears",
  SCHOOL_SETTINGS: "schoolSettings",
  SYNC_METADATA: "syncMetadata", // Track last sync times
} as const;

export type OfflineDataType = (typeof STORES)[keyof typeof STORES];

interface SyncMetadata {
  store: OfflineDataType;
  lastSyncTime: number;
  version: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initializeOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      Object.values(STORES).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: "id" });
        }
      });

      // Sync metadata store
      if (!database.objectStoreNames.contains(STORES.SYNC_METADATA)) {
        database.createObjectStore(STORES.SYNC_METADATA, { keyPath: "store" });
      }
    };
  });
}

/**
 * Get all data from a store
 */
export async function getAllOfflineData<T>(
  storeName: OfflineDataType
): Promise<T[]> {
  try {
    const database = await initializeOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T[]);
    });
  } catch (error) {
    console.error(`Failed to get data from ${storeName}:`, error);
    return [];
  }
}

/**
 * Get single item from store
 */
export async function getOfflineData<T>(
  storeName: OfflineDataType,
  id: string | number
): Promise<T | null> {
  try {
    const database = await initializeOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T | null);
    });
  } catch (error) {
    console.error(`Failed to get item from ${storeName}:`, error);
    return null;
  }
}

/**
 * Save data to store
 */
export async function saveOfflineData<T extends { id: string | number }>(
  storeName: OfflineDataType,
  data: T | T[]
): Promise<void> {
  try {
    const database = await initializeOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        store.put(item);
      }

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  } catch (error) {
    console.error(`Failed to save data to ${storeName}:`, error);
  }
}

/**
 * Clear all data from a store
 */
export async function clearOfflineStore(storeName: OfflineDataType): Promise<void> {
  try {
    const database = await initializeOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error(`Failed to clear ${storeName}:`, error);
  }
}

/**
 * Get last sync time for a store
 */
export async function getLastSyncTime(storeName: OfflineDataType): Promise<number | null> {
  try {
    const database = await initializeOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.SYNC_METADATA, "readonly");
      const store = transaction.objectStore(STORES.SYNC_METADATA);
      const request = store.get(storeName);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as SyncMetadata | undefined;
        resolve(result?.lastSyncTime ?? null);
      };
    });
  } catch (error) {
    console.error(`Failed to get last sync time for ${storeName}:`, error);
    return null;
  }
}

/**
 * Update last sync time for a store
 */
export async function updateLastSyncTime(storeName: OfflineDataType): Promise<void> {
  try {
    const database = await initializeOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.SYNC_METADATA, "readwrite");
      const store = transaction.objectStore(STORES.SYNC_METADATA);

      const metadata: SyncMetadata = {
        store: storeName,
        lastSyncTime: Date.now(),
        version: DB_VERSION,
      };

      const request = store.put(metadata);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
    });
  } catch (error) {
    console.error(`Failed to update sync time for ${storeName}:`, error);
  }
}

/**
 * Get cache stats for debugging
 */
export async function getOfflineCacheStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};
  for (const storeName of Object.values(STORES)) {
    const data = await getAllOfflineData(storeName);
    stats[storeName] = data.length;
  }
  return stats;
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    const database = await initializeOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(Object.values(STORES), "readwrite");

      Object.values(STORES).forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  } catch (error) {
    console.error("Failed to clear all offline data:", error);
  }
}
