import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OfflineIndicator from "@/components/OfflineIndicator";
import SyncStatusDashboard from "@/components/SyncStatusDashboard";
import OfflineSyncInitializer from "@/components/OfflineSyncInitializer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KING'S HEART MONTESSORI SCHOOL",
  description: "School Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans">
          <OfflineSyncInitializer />
          <OfflineIndicator />
          <SyncStatusDashboard />
          {children} <ToastContainer position="bottom-right" theme="light" />
        </body>
      </html>
    </ClerkProvider>
  );
}
