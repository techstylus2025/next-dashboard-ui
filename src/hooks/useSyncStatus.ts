/**
 * Hook for sync status in components
 */

"use client";

import { useEffect, useState } from "react";
import { getSyncStatus, subscribeSyncStatus } from "@/lib/syncStatus";
import type { SyncStatus } from "@/lib/syncStatus";

/**
 * Hook to track sync status
 */
export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(() => getSyncStatus());

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  return status;
}

/**
 * Hook to trigger sync on demand
 */
export function useSyncTrigger() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const { syncPendingOperations } = await import("@/lib/syncEngine.ts");
      const result = await syncPendingOperations();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setError(message);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return { sync, isSyncing, error };
}
