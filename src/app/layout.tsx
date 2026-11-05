import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OfflineIndicator from "@/components/OfflineIndicator";
import SyncStatusDashboard from "@/components/SyncStatusDashboard";
import OfflineSyncInitializer from "@/components/OfflineSyncInitializer";
import { getSchoolBranding } from "@/lib/schoolBranding";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolBranding();
  return {
    title: school.name,
    description: `${school.name} | School Management System`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <OfflineSyncInitializer />
        <OfflineIndicator />
        <SyncStatusDashboard />
        {children} <ToastContainer position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
