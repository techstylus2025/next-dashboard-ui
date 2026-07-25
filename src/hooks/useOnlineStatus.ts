/**
 * Hook for detecting online/offline status in components
 */

"use client";

import { useEffect, useState } from "react";
import {
  initializeOfflineDetection,
  isOnline,
  subscribeToOnlineStatus,
} from "@/lib/offlineStatus";

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize detection on first load
    if (!initialized) {
      initializeOfflineDetection();
      setOnline(isOnline());
      setInitialized(true);
    }

    // Subscribe to status changes
    const unsubscribe = subscribeToOnlineStatus((isOnlineNow) => {
      setOnline(isOnlineNow);
    });

    return unsubscribe;
  }, [initialized]);

  return online;
}

/**
 * Hook to execute a callback when coming back online
 */
export function useOnlineCallback(callback: () => void): void {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      callback();
    }
  }, [isOnline, callback]);
}
