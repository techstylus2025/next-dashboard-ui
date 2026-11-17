import type { CapacitorConfig } from "@capacitor/cli";

const appUrl =
  process.env.APP_URL || "https://school-management-system-three-gold.vercel.app/";
const appHost = new URL(appUrl).hostname;

if (!appUrl.startsWith("https://")) {
  throw new Error("APP_URL must use HTTPS.");
}

const config: CapacitorConfig = {
  appId: "com.lamadev.schoolmanagement",
  appName: "School Management",
  webDir: "www",
  server: {
    url: appUrl,
    cleartext: false,
    allowNavigation: [appHost],
  },
};

export default config;
