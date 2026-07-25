/**
 * Offline-aware wrappers for server actions
 * Check if offline before executing, queue operation instead
 */

"use client";

import { isOnline } from "@/lib/offlineStatus";
import { queueOperation } from "@/lib/operationQueue";
import type { QueuedOperation } from "@/lib/operationQueue";
import * as termlyReportActions from "@/lib/termlyReportActions";

/**
 * Wrapper for updateTermlyReportMeta that queues if offline
 */
export async function updateTermlyReportMetaWithQueue(
  input: Parameters<typeof termlyReportActions.updateTermlyReportMeta>[0]
): Promise<{ success: boolean; error: string | null; queued?: boolean }> {
  if (!isOnline()) {
    try {
      await queueOperation({
        action: "UPDATE",
        entityType: "report",
        entityId: input.reportId,
        payload: input,
      });
      return {
        success: true,
        error: null,
        queued: true,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to queue offline update",
      };
    }
  }

  return termlyReportActions.updateTermlyReportMeta(input);
}

/**
 * Wrapper for upsertTermlySubjectLine that queues if offline
 */
export async function upsertTermlySubjectLineWithQueue(
  input: Parameters<typeof termlyReportActions.upsertTermlySubjectLine>[0]
): Promise<{ success: boolean; error: string | null; queued?: boolean }> {
  if (!isOnline()) {
    try {
      await queueOperation({
        action: "UPDATE",
        entityType: "report",
        entityId: input.reportId,
        payload: input,
      });
      return {
        success: true,
        error: null,
        queued: true,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to queue offline update",
      };
    }
  }

  return termlyReportActions.upsertTermlySubjectLine(input);
}

/**
 * Wrapper for deleteTermlyReport that queues if offline
 */
export async function deleteTermlyReportWithQueue(
  reportId: number
): Promise<{ success: boolean; error: string | null; queued?: boolean }> {
  if (!isOnline()) {
    try {
      await queueOperation({
        action: "DELETE",
        entityType: "report",
        entityId: reportId,
        payload: { reportId },
      });
      return {
        success: true,
        error: null,
        queued: true,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to queue offline deletion",
      };
    }
  }

  return termlyReportActions.deleteTermlyReport(reportId);
}

/**
 * Wrapper for createOrInitTermlyReports that queues if offline
 */
export async function createOrInitTermlyReportsWithQueue(
  input: Parameters<typeof termlyReportActions.createOrInitTermlyReports>[0]
): Promise<{ success: boolean; error: string | null; queued?: boolean }> {
  if (!isOnline()) {
    try {
      await queueOperation({
        action: "CREATE",
        entityType: "report",
        payload: input,
      });
      return {
        success: true,
        error: null,
        queued: true,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to queue offline creation",
      };
    }
  }

  return termlyReportActions.createOrInitTermlyReports(input);
}

/**
 * These functions require server-only access, so they always execute on server:
 * - getAllStudentsInClass (read-only, safe offline with cached data)
 * - generateTermlyReportsBulk (read-heavy with writes)
 * - generateTermlyReportsForSupervisorClass (read-heavy with writes)
 * - generateTermlyReportForSingleStudent (read-heavy with writes)
 */
