import ResultsPageOfflineWrapper from "@/components/results/ResultsPageOfflineWrapper";
import { loadResultsPageData } from "@/lib/resultsData";
import { getCurrentAuthContext } from "@/lib/auth";

export default async function ResultsPage() {
  const { userId, role } = await getCurrentAuthContext();
  const pageData = await loadResultsPageData(userId ?? undefined, role ?? undefined);

  return (
    <div className="min-h-[60vh] flex-1 rounded-xl bg-lamaSkyLight p-2 sm:rounded-2xl sm:p-4">
      <ResultsPageOfflineWrapper initialData={pageData} />
    </div>
  );
}
