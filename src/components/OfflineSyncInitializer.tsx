/**
 * Component to initialize offline and sync systems on app startup
 */

"use client";

import { useEffect } from "react";
import { initializeOfflineDetection } from "@/lib/offlineStatus";
import { setupAutoSyncOnOnline } from "@/lib/syncEngine";

export default function OfflineSyncInitializer() {
  useEffect(() => {
    // Initialize offline detection
    initializeOfflineDetection();

    // Setup auto-sync when coming back online
    const unsubscribeSync = setupAutoSyncOnOnline();

    return () => {
      unsubscribeSync();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
