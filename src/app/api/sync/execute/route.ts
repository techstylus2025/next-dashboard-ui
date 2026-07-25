/**
 * API route for replaying queued operations during sync
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import * as termlyReportActions from "@/lib/termlyReportActions";
import type { QueuedOperation } from "@/lib/operationQueue";

/**
 * POST /api/sync/execute
 * Executes a single queued operation during sync
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const operation: QueuedOperation = await request.json();

    // Validate operation has required fields
    if (!operation.id || !operation.action || !operation.entityType) {
      return NextResponse.json(
        { message: "Invalid operation format" },
        { status: 400 }
      );
    }

    // Execute based on operation type
    let result: any = { success: false, error: "Unknown operation type" };

    try {
      switch (operation.action) {
        case "UPDATE":
          if (operation.entityType === "report") {
            const payload = operation.payload as Parameters<
              typeof termlyReportActions.updateTermlyReportMeta
            >[0];
            result = await termlyReportActions.updateTermlyReportMeta(payload);
          }
          break;

        case "CREATE":
          if (operation.entityType === "report") {
            const payload = operation.payload as Parameters<
              typeof termlyReportActions.createOrInitTermlyReports
            >[0];
            result = await termlyReportActions.createOrInitTermlyReports(
              payload
            );
          }
          break;

        case "DELETE":
          if (operation.entityType === "report") {
            const payload = operation.payload as { reportId: number };
            result = await termlyReportActions.deleteTermlyReport(
              payload.reportId
            );
          }
          break;

        default:
          return NextResponse.json(
            { message: `Unknown action: ${operation.action}` },
            { status: 400 }
          );
      }

      if (!result.success) {
        return NextResponse.json(
          {
            message: result.error || "Operation failed",
            success: false,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "Operation executed successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error executing operation:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        {
          message: errorMsg,
          success: false,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
