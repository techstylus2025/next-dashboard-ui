# Windows desktop app

This Electron app opens the hosted School Management System in a native desktop window. The Next.js app, database, and authentication services must remain available online.

## Build on Windows

Install Node.js, then run:

```powershell
npm install
npm run dist
```

The Windows installer is written to `release/`. To use another deployment, set `APP_URL` in the environment where the installed app starts:

```powershell
$env:APP_URL = "https://your-school.example.com/"
npm start
```

The app only navigates inside the configured site's HTTPS origin. Other HTTP(S) links open in the system browser.
