/**
 * Sync status dashboard component
 * Shows queued operations, sync progress, and history
 */

"use client";

import { useEffect, useState } from "react";
import { useSyncStatus, useSyncTrigger } from "@/hooks/useSyncStatus";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getQueueStats, getRetryableOperations } from "@/lib/operationQueue";
import { formatSyncDuration, getLastSyncTimeLabel } from "@/lib/syncStatus";
import type { QueuedOperation } from "@/lib/operationQueue";

export default function SyncStatusDashboard() {
  const syncStatus = useSyncStatus();
  const { sync, isSyncing } = useSyncTrigger();
  const isOnline = useOnlineStatus();
  const [queueStats, setQueueStats] = useState<any>(null);
  const [retryable, setRetryable] = useState<QueuedOperation[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStats = async () => {
      const stats = await getQueueStats();
      const failed = await getRetryableOperations(3);
      setQueueStats(stats);
      setRetryable(failed);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  // Don't show if nothing to sync and online
  if (isOnline && (!queueStats || queueStats.total === 0)) {
    return null;
  }

  const progressPercent =
    queueStats?.total > 0
      ? Math.round((syncStatus.progress.completed / syncStatus.progress.total) * 100)
      : 0;

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-50 to-slate-50 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus.isSyncing
                  ? "bg-blue-500 animate-pulse"
                  : syncStatus.failureCount > 0
                  ? "bg-red-500"
                  : "bg-green-500"
              }`} />
              <h3 className="font-semibold text-sm text-slate-900">
                {syncStatus.isSyncing
                  ? "Syncing..."
                  : syncStatus.failureCount > 0
                  ? "Sync Failed"
                  : "Sync Status"}
              </h3>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              {showDetails ? "Hide" : "Details"}
            </button>
          </div>

          {/* Quick Stats */}
          {queueStats && (
            <div className="text-xs text-slate-600 space-y-1">
              <p>Queue: {queueStats.pending} pending, {queueStats.failed} failed</p>
              <p>Synced: {syncStatus.successCount} ✓ • Failed: {syncStatus.failureCount} ✗</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {syncStatus.isSyncing && (
          <div className="px-4 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700">
                {syncStatus.currentOperation || "Starting sync..."}
              </span>
              <span className="text-xs text-slate-500">
                {syncStatus.progress.completed}/{syncStatus.progress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4 space-y-3">
          {/* Status Messages */}
          {syncStatus.error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">{syncStatus.error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {syncStatus.failureCount > 0 && (
              <button
                onClick={() => sync()}
                disabled={isSyncing || !isOnline}
                className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSyncing ? "Retrying..." : "Retry Failed"}
              </button>
            )}
            {queueStats?.pending === 0 && syncStatus.failureCount === 0 ? (
              <div className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-green-100 text-green-700 text-center">
                All synced ✓
              </div>
            ) : (
              <button
                onClick={() => sync()}
                disabled={isSyncing || !isOnline || (queueStats?.total ?? 0) === 0}
                className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            )}
          </div>

          {/* Last Sync Time */}
          <div className="text-xs text-slate-500 text-center">
            Last sync: {getLastSyncTimeLabel()}
          </div>
        </div>

        {/* Details Section */}
        {showDetails && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {/* Queue Details */}
              {queueStats && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-900">Queue Status</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <p className="text-slate-500">Pending</p>
                      <p className="font-semibold text-slate-900">{queueStats.pending}</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <p className="text-slate-500">Failed</p>
                      <p className="font-semibold text-red-600">{queueStats.failed}</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <p className="text-slate-500">Synced</p>
                      <p className="font-semibold text-green-600">{syncStatus.successCount}</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <p className="text-slate-500">Oldest</p>
                      <p className="font-semibold text-slate-900">
                        {queueStats.oldestOperation
                          ? formatSyncDuration(Date.now() - queueStats.oldestOperation.timestamp)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Retryable Operations */}
              {retryable.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-900">Failed Operations</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {retryable.map((op) => (
                      <div
                        key={op.id}
                        className="p-2 bg-white rounded border border-red-200 text-xs"
                      >
                        <p className="font-medium text-slate-900">
                          {op.action} {op.entityType} (Retry: {op.retries}/3)
                        </p>
                        {op.lastError && (
                          <p className="text-red-600 truncate">{op.lastError}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                <p>Connection: <span className={isOnline ? "text-green-600" : "text-red-600"}>
                  {isOnline ? "Online" : "Offline"}
                </span></p>
                <p>Last sync: {getLastSyncTimeLabel()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
