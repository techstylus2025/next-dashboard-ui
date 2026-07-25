/**
 * Offline indicator component
 * Shows when user is in offline mode and data is cached
 */

"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 0 1 5.11 2.523a6 6 0 0 1 8.367 8.367zM9 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">You are offline</p>
            <p className="text-xs opacity-90">
              Viewing cached data • Changes will sync when you reconnect
            </p>
          </div>
        </div>
        <div className="text-xs font-medium bg-black/20 px-3 py-1.5 rounded-full whitespace-nowrap">
          Read-only mode
        </div>
      </div>
    </div>
  );
}
