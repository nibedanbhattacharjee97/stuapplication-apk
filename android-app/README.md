# Anudip Student Care — Native Android Application

Native Kotlin + Jetpack Compose + Material 3 Android application replicating the workflows, branding, validation rules, and Q&A Care Bot experience of `https://teststudentsapp.streamlit.app/`.

## Architecture & Tech Stack
- **Language**: Kotlin 2.1
- **UI**: Jetpack Compose + Material 3
- **Architecture**: MVVM (`StudentCareViewModel`, `StateFlow`, `StudentCareRepository`)
- **Navigation**: Jetpack Compose Navigation (`AppNavHost`)
- **Networking**: Retrofit 2 + OkHttp 4 (HTTPS-only, Bearer token auth interceptor)
- **Local Session Storage**: Jetpack DataStore Preferences (24-hour token expiry)
- **Location & Attachments**: `FusedLocationProviderClient` + `Geocoder` (State detection), `ActivityResultContracts.TakePicture` & `PickVisualMedia`
- **Splash Screen & Icon**: Android 12+ `SplashScreen` API + Adaptive Launcher Icon

## Backend Integration (Streamlit -> Secure REST API Bridge)
Streamlit runs server-side Python over WebSockets and does not expose public REST endpoints. To keep student records unified without exposing Google Sheets or database credentials inside the APK:
1. Deploy the Express API server in the root project (`server.ts`) or your FastAPI service wrapping the same Google Sheets / CMIS data source used by Streamlit.
2. Configure `GOOGLE_SHEETS_WEBHOOK_URL` and `SESSION_SECRET` on the server via environment variables.
3. Update `API_BASE_URL` in `app/build.gradle.kts` to your HTTPS backend domain before building a release binary.

## Testing on a Physical Android Phone
1. Enable **Developer Options** on your Android phone: *Settings → About Phone → tap Build Number 7 times*.
2. Enable **USB Debugging** inside *Settings → Developer Options*.
3. Connect the phone via USB and accept the RSA debugging prompt on the phone screen.
4. Open the `android-app/` folder in **Android Studio**, wait for Gradle sync, select your device, and click **Run (▶)** — or run from terminal:
   ```bash
   cd android-app
   ./gradlew installDebug
   ```

## Generating a Release APK or Android App Bundle (AAB)
1. Create a release keystore (one-time):
   ```bash
   keytool -genkey -v -keystore anudip-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias anudip_key
   ```
2. Configure `signingConfigs.release` in `app/build.gradle.kts` referencing your local keystore properties (never commit `.jks` or passwords to git).
3. Build the Release APK or Play Store AAB:
   ```bash
   cd android-app
   ./gradlew assembleRelease   # Output: app/build/outputs/apk/release/app-release.apk
   ./gradlew bundleRelease     # Output: app/build/outputs/bundle/release/app-release.aab
   ```
