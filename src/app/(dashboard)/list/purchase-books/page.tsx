import BooksManagement from "@/components/books/BooksManagement";
import { loadPurchaseBooksPageData } from "@/lib/purchaseBooksData";
import { auth } from "@clerk/nextjs/server";

export default async function PurchaseBooksPage() {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    const {
      classes,
      books,
      orders,
      pendingOrderCount,
      canAdmin,
      isParent,
    } = await loadPurchaseBooksPageData(role, userId ?? undefined);

    return (
      <div className="flex-1 w-full p-4 min-h-[60vh] rounded-2xl bg-lamaSkyLight">
        <BooksManagement
          role={role}
          classes={classes}
          books={books}
          orders={orders}
          pendingOrderCount={pendingOrderCount}
          canAdmin={canAdmin}
          isParent={isParent}
        />
      </div>
    );
  } catch (error) {
    console.error("Purchase books page error:", error);
    return (
      <div className="flex-1 min-h-[40vh] rounded-2xl bg-lamaSkyLight p-8">
        <p className="text-slate-700 font-medium">Could not load purchase books.</p>
        <p className="text-sm text-slate-500 mt-2">
          {error instanceof Error
            ? error.message
            : "Please refresh the page or contact support if the issue persists."}
        </p>
      </div>
    );
  }
}
