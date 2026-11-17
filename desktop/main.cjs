const { app, BrowserWindow, shell } = require("electron");

const appUrl = process.env.APP_URL || "https://school-management-system-three-gold.vercel.app/";
const parsedAppUrl = new URL(appUrl);

if (parsedAppUrl.protocol !== "https:") {
  throw new Error("APP_URL must use HTTPS.");
}

const appOrigin = parsedAppUrl.origin;

function openExternal(url) {
  try {
    const target = new URL(url);
    if (target.protocol === "https:" || target.protocol === "http:") {
      shell.openExternal(target.href).catch((error) => {
        console.error("Could not open external link:", error);
      });
    }
  } catch (error) {
    console.error("Could not open invalid external link:", error);
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    title: "School Management",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (new URL(url).origin !== appOrigin) {
      openExternal(url);
    }
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== appOrigin) {
      event.preventDefault();
      openExternal(url);
    }
  });

  window.loadURL(parsedAppUrl.href);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
