/**
 * Hook for loading results data with offline fallback
 */

"use client";

import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getCachedResultsData } from "@/lib/offlineSync";
import type { ResultsPageContext, TermlyReportRow } from "@/lib/resultsData";

export function useOfflineCachedResults() {
  const isOnline = useOnlineStatus();
  const [cachedData, setCachedData] = useState<Partial<ResultsPageContext> | null>(null);
  const [loading, setCachedLoading] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setCachedLoading(true);
      getCachedResultsData()
        .then((data) => {
          setCachedData(data);
        })
        .catch((error) => {
          console.error("Failed to load cached results:", error);
          setCachedData(null);
        })
        .finally(() => {
          setCachedLoading(false);
        });
    }
  }, [isOnline]);

  return { cachedData, loading, isOnline };
}

/**
 * Hook for loading a single report from cache
 */
export function useCachedReport(reportId?: number) {
  const [report, setReport] = useState<TermlyReportRow | null>(null);
  const [loading, setLoading] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!reportId || isOnline) return;

    setLoading(true);
    getCachedResultsData()
      .then((data) => {
        if (data?.reports) {
          const found = data.reports.find((r) => r.id === reportId);
          setReport(found || null);
        }
      })
      .catch((error) => {
        console.error("Failed to load cached report:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [reportId, isOnline]);

  return { report, loading };
}
