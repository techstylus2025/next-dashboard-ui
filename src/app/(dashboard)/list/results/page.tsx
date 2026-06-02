import ResultsManagement from "@/components/results/ResultsManagement";
import { loadResultsPageData } from "@/lib/resultsData";
import { auth } from "@clerk/nextjs/server";

export default async function ResultsPage() {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const pageData = await loadResultsPageData(userId ?? undefined, role);

  return (
    <div className="flex-1 p-4 min-h-[60vh] rounded-2xl bg-lamaSkyLight">
      <ResultsManagement {...pageData} />
    </div>
  );
}
