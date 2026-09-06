"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      router.refresh();
    }, 30000);

    return () => window.clearInterval(refreshInterval);
  }, [router]);

  return null;
}
