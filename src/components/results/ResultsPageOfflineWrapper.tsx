/**
 * Results page wrapper for offline fallback support
 */

"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useOfflineCachedResults } from "@/hooks/useOfflineCache";
import ResultsManagement from "@/components/results/ResultsManagement";
import type { ResultsPageContext } from "@/lib/resultsData";

export default function ResultsPageOfflineWrapper({
  initialData,
}: {
  initialData: ResultsPageContext;
}) {
  const isOnline = useOnlineStatus();
  const { cachedData, loading } = useOfflineCachedResults();

  // Use cached data when offline, otherwise use server-fetched data
  const dataToDisplay = !isOnline && cachedData ? cachedData : initialData;

  // Merge cached data with initial data structure
  const mergedData: ResultsPageContext = {
    ...initialData,
    ...(dataToDisplay as Partial<ResultsPageContext>),
    // Preserve user context from initial data
    role: initialData.role,
    userId: initialData.userId,
    isAdmin: initialData.isAdmin,
    isSupervisor: initialData.isSupervisor,
    canManageReports: initialData.canManageReports,
    canRecordScores: initialData.canRecordScores,
    supervisedClassIds: initialData.supervisedClassIds,
    supervisedClasses: initialData.supervisedClasses,
    assignedSubjects: initialData.assignedSubjects,
  };

  // Show loading state while fetching cache
  if (!isOnline && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading cached data...</p>
        </div>
      </div>
    );
  }

  // Show no data message if offline with no cache
  if (!isOnline && !cachedData && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-2xl bg-lamaSkyLight p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            No Cached Data Available
          </h2>
          <p className="text-slate-600 mb-4">
            You're offline and we don't have any cached data to display. Please go online
            to load your data first.
          </p>
          <p className="text-sm text-slate-500">
            Once you view your data while online, it will be available offline automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={!isOnline ? "opacity-90" : ""}>
      <ResultsManagement {...mergedData} />
    </div>
  );
}
