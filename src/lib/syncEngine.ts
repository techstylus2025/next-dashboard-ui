/**
 * Sync engine - handles replaying operations when online
 */

import { isOnline, waitForOnline } from "@/lib/offlineStatus";
import {
  getPendingOperations,
  getRetryableOperations,
  updateOperationStatus,
  deleteOperation,
  type QueuedOperation,
} from "@/lib/operationQueue";
import {
  startSync,
  updateSyncProgress,
  syncOperationSuccess,
  syncOperationFailed,
  completeSyncCycle,
} from "@/lib/syncStatus";
import { toast } from "react-toastify";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1s, exponential backoff
const MAX_SYNC_DURATION = 60000; // 60 second timeout per operation

/**
 * Execute a single operation (calls appropriate server action)
 */
async function executeOperation(
  operation: QueuedOperation
): Promise<{ success: boolean; error?: string }> {
  try {
    // Placeholder - in real implementation, would call appropriate server action
    // based on operation.action and operation.entityType
    const response = await fetch("/api/sync/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(operation),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(retries: number): number {
  return RETRY_DELAY_MS * Math.pow(2, retries);
}

/**
 * Sync all pending operations
 */
export async function syncPendingOperations(): Promise<{
  succeeded: number;
  failed: number;
  total: number;
}> {
  // If already offline, wait for online with timeout
  if (!isOnline()) {
    const online = await waitForOnline(30000);
    if (!online) {
      return { succeeded: 0, failed: 0, total: 0 };
    }
  }

  try {
    const operations = await getPendingOperations();
    const total = operations.length;

    if (total === 0) {
      console.log("No operations to sync");
      return { succeeded: 0, failed: 0, total: 0 };
    }

    console.log(`Starting sync of ${total} operations`);
    startSync(total);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];

      try {
        // Check if operation should be retried
        if (
          operation.status === "failed" &&
          operation.retries >= MAX_RETRIES
        ) {
          console.warn(
            `Operation ${operation.id} exceeded max retries (${MAX_RETRIES})`
          );
          failed++;
          updateSyncProgress(i + 1, `Skipped (max retries exceeded)`);
          continue;
        }

        // Wait before retry if needed
        if (operation.status === "failed" && operation.retries > 0) {
          const delay = getBackoffDelay(operation.retries);
          console.log(
            `Waiting ${delay}ms before retry of operation ${operation.id}`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Update status to syncing
        await updateOperationStatus(operation.id, "syncing");
        updateSyncProgress(
          i + 1,
          `${operation.action} ${operation.entityType} (#${i + 1}/${total})`
        );

        // Execute operation with timeout
        const timeoutPromise = new Promise<{
          success: boolean;
          error?: string;
        }>((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: false,
                error: "Operation timeout",
              }),
            MAX_SYNC_DURATION
          )
        );

        const result = await Promise.race([
          executeOperation(operation),
          timeoutPromise,
        ]);

        if (result.success) {
          // Delete from queue after successful sync
          await deleteOperation(operation.id);
          syncOperationSuccess();
          succeeded++;
          console.log(`✓ Operation ${operation.id} synced successfully`);
        } else {
          // Update with error but keep in queue for retry
          await updateOperationStatus(
            operation.id,
            "failed",
            result.error
          );
          syncOperationFailed(result.error || "Unknown error");
          failed++;
          console.error(
            `✗ Operation ${operation.id} failed:`,
            result.error
          );
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        await updateOperationStatus(operation.id, "failed", errorMsg);
        syncOperationFailed(errorMsg);
        failed++;
        console.error(`✗ Operation ${operation.id} error:`, error);
      }
    }

    completeSyncCycle(failed > 0);

    console.log(
      `Sync completed: ${succeeded} succeeded, ${failed} failed`
    );

    return { succeeded, failed, total };
  } catch (error) {
    console.error("Sync error:", error);
    completeSyncCycle(true);
    return { succeeded: 0, failed: 0, total: 0 };
  }
}

/**
 * Retry failed operations
 */
export async function retryFailedOperations(): Promise<{
  retried: number;
  succeeded: number;
  failed: number;
}> {
  const operations = await getRetryableOperations(MAX_RETRIES);

  if (operations.length === 0) {
    console.log("No retryable operations");
    return { retried: 0, succeeded: 0, failed: 0 };
  }

  console.log(`Retrying ${operations.length} failed operations`);

  let succeeded = 0;
  let failed = 0;

  for (const operation of operations) {
    try {
      const delay = getBackoffDelay(operation.retries);
      await new Promise((resolve) => setTimeout(resolve, delay));

      await updateOperationStatus(operation.id, "syncing");

      const result = await executeOperation(operation);

      if (result.success) {
        await deleteOperation(operation.id);
        succeeded++;
      } else {
        await updateOperationStatus(operation.id, "failed", result.error);
        failed++;
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      await updateOperationStatus(operation.id, "failed", errorMsg);
      failed++;
    }
  }

  return { retried: operations.length, succeeded, failed };
}

/**
 * Set up auto-sync when coming back online
 */
export function setupAutoSyncOnOnline(callback?: (result: any) => void): () => void {
  const handleOnline = async () => {
    console.log("Connection restored, starting sync...");
    try {
      const result = await syncPendingOperations();
      if (result.total > 0) {
        if (result.failed === 0) {
          toast.success(
            `Synced ${result.succeeded} operation${result.succeeded !== 1 ? "s" : ""}`
          );
        } else {
          toast.warning(
            `Synced ${result.succeeded} operation${result.succeeded !== 1 ? "s" : ""}, ${result.failed} failed`
          );
        }
      }
      callback?.(result);
    } catch (error) {
      console.error("Auto-sync error:", error);
      toast.error("Failed to sync pending changes");
    }
  };

  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
