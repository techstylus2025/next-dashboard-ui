import ResultsPageOfflineWrapper from "@/components/results/ResultsPageOfflineWrapper";
import { loadResultsPageData } from "@/lib/resultsData";
import { getCurrentAuthContext } from "@/lib/auth";

export default async function ResultsPage() {
  const { userId, role } = await getCurrentAuthContext();
  const pageData = await loadResultsPageData(userId ?? undefined, role ?? undefined);

  return (
    <div className="flex-1 p-4 min-h-[60vh] rounded-2xl bg-lamaSkyLight">
      <ResultsPageOfflineWrapper initialData={pageData} />
    </div>
  );
}
