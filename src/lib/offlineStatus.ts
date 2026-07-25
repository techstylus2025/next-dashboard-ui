/**
 * Online/offline status detection and management
 */

let isOnlineStatus = typeof navigator !== "undefined" ? navigator.onLine : true;
let listeners: Set<(isOnline: boolean) => void> = new Set();

/**
 * Initialize online status detection
 */
export function initializeOfflineDetection(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    isOnlineStatus = true;
    notifyListeners(true);
  });

  window.addEventListener("offline", () => {
    isOnlineStatus = false;
    notifyListeners(false);
  });
}

/**
 * Get current online status
 */
export function isOnline(): boolean {
  return isOnlineStatus;
}

/**
 * Subscribe to online/offline status changes
 */
export function subscribeToOnlineStatus(
  callback: (isOnline: boolean) => void
): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Notify all listeners of status change
 */
function notifyListeners(isOnline: boolean): void {
  listeners.forEach((callback) => {
    try {
      callback(isOnline);
    } catch (error) {
      console.error("Error in online status listener:", error);
    }
  });
}

/**
 * Wait for online status (useful for syncing)
 */
export async function waitForOnline(maxWaitMs: number = 30000): Promise<boolean> {
  if (isOnlineStatus) return true;

  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let unsubscribe: (() => void) | null = null;

    timeoutId = setTimeout(() => {
      if (unsubscribe) unsubscribe();
      resolve(false); // Return false if timeout reached
    }, maxWaitMs);

    unsubscribe = subscribeToOnlineStatus((online) => {
      if (online) {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(true);
      }
    });
  });
}

/**
 * Check if we should use offline cache
 */
export function shouldUseOfflineCache(): boolean {
  return !isOnlineStatus;
}
