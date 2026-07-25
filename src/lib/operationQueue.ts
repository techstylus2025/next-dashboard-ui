/**
 * Operation queue for offline writes
 * Stores operations that occurred while offline and syncs them when online
 */

const QUEUE_DB_NAME = "OperationQueueDB";
const QUEUE_STORE_NAME = "operations";
const DB_VERSION = 1;

let queueDb: IDBDatabase | null = null;

export interface QueuedOperation {
  id: string; // UUID
  timestamp: number;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: "report" | "class" | "student" | "announcement" | "event"; // Expandable
  entityId?: string | number;
  payload: Record<string, any>;
  status: "pending" | "syncing" | "synced" | "failed";
  retries: number;
  lastError?: string;
  lastRetryTime?: number;
}

/**
 * Initialize queue database
 */
async function initQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (queueDb) {
      resolve(queueDb);
      return;
    }

    const request = indexedDB.open(QUEUE_DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open queue DB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      queueDb = request.result;
      resolve(queueDb);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        db.createObjectStore(QUEUE_STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Add operation to queue
 */
export async function queueOperation(
  operation: Omit<QueuedOperation, "id" | "timestamp" | "status" | "retries">
): Promise<QueuedOperation> {
  const db = await initQueueDb();

  const queuedOp: QueuedOperation = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    status: "pending",
    retries: 0,
    ...operation,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUEUE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    const request = store.add(queuedOp);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(queuedOp);
  });
}

/**
 * Get all pending operations
 */
export async function getPendingOperations(): Promise<QueuedOperation[]> {
  try {
    const db = await initQueueDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE_NAME, "readonly");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const all = request.result as QueuedOperation[];
        // Return pending and failed operations (prioritize pending)
        const operations = all.filter((op) => op.status !== "synced");
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };
    });
  } catch (error) {
    console.error("Failed to get pending operations:", error);
    return [];
  }
}

/**
 * Get operation by ID
 */
export async function getOperation(id: string): Promise<QueuedOperation | null> {
  try {
    const db = await initQueueDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE_NAME, "readonly");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (error) {
    console.error("Failed to get operation:", error);
    return null;
  }
}

/**
 * Update operation status
 */
export async function updateOperationStatus(
  id: string,
  status: QueuedOperation["status"],
  error?: string
): Promise<void> {
  try {
    const db = await initQueueDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const op = getRequest.result as QueuedOperation;
        if (op) {
          op.status = status;
          if (error) op.lastError = error;
          if (status === "syncing" || status === "failed") {
            op.lastRetryTime = Date.now();
            if (status === "failed") op.retries += 1;
          }

          const updateRequest = store.put(op);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        }
      };
    });
  } catch (error) {
    console.error("Failed to update operation status:", error);
  }
}

/**
 * Delete operation from queue (after successful sync)
 */
export async function deleteOperation(id: string): Promise<void> {
  try {
    const db = await initQueueDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to delete operation:", error);
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
  synced: number;
  total: number;
  oldestOperation?: QueuedOperation;
}> {
  try {
    const db = await initQueueDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE_NAME, "readonly");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const operations = request.result as QueuedOperation[];
        const stats = {
          pending: operations.filter((op) => op.status === "pending").length,
          syncing: operations.filter((op) => op.status === "syncing").length,
          failed: operations.filter((op) => op.status === "failed").length,
          synced: operations.filter((op) => op.status === "synced").length,
          total: operations.length,
          oldestOperation:
            operations.length > 0
              ? operations.reduce((oldest, op) =>
                  op.timestamp < oldest.timestamp ? op : oldest
                )
              : undefined,
        };
        resolve(stats);
      };
    });
  } catch (error) {
    console.error("Failed to get queue stats:", error);
    return { pending: 0, syncing: 0, failed: 0, synced: 0, total: 0 };
  }
}

/**
 * Clear all operations (use with caution - only on logout)
 */
export async function clearQueue(): Promise<void> {
  try {
    const db = await initQueueDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to clear queue:", error);
  }
}

/**
 * Retry failed operations that haven't exceeded max retries
 */
export async function getRetryableOperations(
  maxRetries: number = 3
): Promise<QueuedOperation[]> {
  const ops = await getPendingOperations();
  return ops.filter((op) => op.status === "failed" && op.retries < maxRetries);
}
