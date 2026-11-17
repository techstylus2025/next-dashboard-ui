# Android APK

This Capacitor app loads the hosted School Management System. The Next.js app, database, and authentication services must remain available online. The APK does not contain the server or database.

## Build a debug APK on Windows

Install Node.js, a Java JDK supported by Android Gradle Plugin, and Android Studio with the Android SDK/platform tools. From this directory run:

```powershell
npm install
npm run android:add
npm run android:sync
Set-Location android
.\gradlew.bat assembleDebug
```

The APK is written to `android\app\build\outputs\apk\debug\app-debug.apk`.

To build for another deployment, set `APP_URL` before `npm run android:sync`; the URL must use HTTPS. For a release/store build, configure a signing key in Android Studio or Gradle and build a signed release APK/AAB.
