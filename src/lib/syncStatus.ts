/**
 * Sync status tracking and management
 */

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  nextSyncTime: number | null;
  successCount: number;
  failureCount: number;
  currentOperation?: string;
  error?: string;
  progress: {
    completed: number;
    total: number;
  };
}

let syncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncTime: null,
  nextSyncTime: null,
  successCount: 0,
  failureCount: 0,
  progress: { completed: 0, total: 0 },
};

let statusListeners: Set<(status: SyncStatus) => void> = new Set();
let autoSyncInterval: NodeJS.Timeout | null = null;

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Subscribe to sync status changes
 */
export function subscribeSyncStatus(
  callback: (status: SyncStatus) => void
): () => void {
  statusListeners.add(callback);
  return () => {
    statusListeners.delete(callback);
  };
}

/**
 * Notify all listeners of status change
 */
function notifyStatusListeners(): void {
  statusListeners.forEach((callback) => {
    try {
      callback(getSyncStatus());
    } catch (error) {
      console.error("Error in sync status listener:", error);
    }
  });
}

/**
 * Update sync status
 */
export function updateSyncStatus(
  updates: Partial<SyncStatus>
): void {
  syncStatus = { ...syncStatus, ...updates };
  notifyStatusListeners();
}

/**
 * Start sync
 */
export function startSync(total: number): void {
  updateSyncStatus({
    isSyncing: true,
    error: undefined,
    progress: { completed: 0, total },
  });
}

/**
 * Update sync progress
 */
export function updateSyncProgress(
  completed: number,
  currentOperation?: string
): void {
  updateSyncStatus({
    progress: { completed, total: syncStatus.progress.total },
    currentOperation,
  });
}

/**
 * Sync operation succeeded
 */
export function syncOperationSuccess(): void {
  updateSyncStatus({
    successCount: syncStatus.successCount + 1,
  });
}

/**
 * Sync operation failed
 */
export function syncOperationFailed(error: string): void {
  updateSyncStatus({
    failureCount: syncStatus.failureCount + 1,
    error,
  });
}

/**
 * Complete sync
 */
export function completeSyncCycle(hadErrors: boolean = false): void {
  updateSyncStatus({
    isSyncing: false,
    lastSyncTime: Date.now(),
    error: hadErrors ? "Some operations failed. Please retry." : undefined,
  });
}

/**
 * Reset sync status
 */
export function resetSyncStatus(): void {
  syncStatus = {
    isSyncing: false,
    lastSyncTime: null,
    nextSyncTime: null,
    successCount: 0,
    failureCount: 0,
    progress: { completed: 0, total: 0 },
  };
  notifyStatusListeners();
}

/**
 * Start auto-sync polling
 */
export function startAutoSync(intervalMs: number = 5000): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }

  autoSyncInterval = setInterval(() => {
    // This will be called by the sync engine
    notifyStatusListeners();
  }, intervalMs);
}

/**
 * Stop auto-sync polling
 */
export function stopAutoSync(): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

/**
 * Format sync duration
 */
export function formatSyncDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Get human-readable last sync time
 */
export function getLastSyncTimeLabel(): string {
  if (!syncStatus.lastSyncTime) return "Never";

  const now = Date.now();
  const diff = now - syncStatus.lastSyncTime;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return "More than a day ago";
}
