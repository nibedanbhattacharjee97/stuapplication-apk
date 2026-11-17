# Google Sheets Webhook Deployment Guide (`Code.gs`)

## How Android Communicates With Google Sheets
Your Android application (`AnudipApiService.kt`) **never** holds Google Sheets IDs, API keys, or webhook URLs.
1. Android sends HTTPS JSON requests to `BuildConfig.API_BASE_URL` (`server.ts`):
   - `POST /api/students/new`
   - `POST /api/students/existing/verify`
   - `POST /api/support/ticket`
2. `server.ts` validates inputs, prevents local duplicates, issues an HMAC-signed `SESSION_SECRET` Bearer token, and forwards the structured event over HTTPS `POST` to `GOOGLE_SHEETS_WEBHOOK`.
3. `Code.gs` routes each event to the right spreadsheet using dynamic Row 1 header matching and deduplication without altering existing records:
   - `NEW_STUDENT` → **Responce_table_For_new_User** (`1ssdr88b1SMyv-qZxQVxceZnfXEvlda8Wd3ol-YCNWkI`), deduplicated by Mobile Number.
   - `EXISTING_STUDENT` → **Responce Table** (`1eqcD5GyRFexRTgMTFkrBV-CcWpsmEnC2wjLlD_-4X5k`), deduplicated by Student ID (`AF0...`).
   - `SUPPORT_TICKET` → **Support_Tickets** tab inside **Responce Table**, deduplicated by `ticketId`.

## Step-by-Step Deployment
1. Open **script.google.com** while signed into the Google account that owns both spreadsheets.
2. Click **New project**, rename it to `Anudip Student Care Webhook`, and replace `Code.gs` with `/backend-api/Code.gs`.
3. (Optional if either workbook has multiple tabs and the target isn't the first tab): Set `EXISTING_STUDENT_TAB` and/or `NEW_STUDENT_TAB` in `CONFIG` at the top of `Code.gs`.
4. (Recommended Security) In Apps Script **Project Settings → Script Properties**, add `WEBHOOK_SECRET` with a strong random secret, and set the same value in AI Studio **Settings → Secrets** as `GOOGLE_SHEETS_WEBHOOK_SECRET`.
5. Click **Deploy → New deployment → Select type: Web app**:
   - **Execute as**: `Me` (your Google account with edit access to both private sheets)
   - **Who has access**: `Anyone` (so `server.ts` can call it without exposing your Google account; protected by `WEBHOOK_SECRET` and private to your server)
6. Click **Deploy**, authorize spreadsheet permissions when prompted, and copy the **Web app URL** (ends with `/exec`).
7. In AI Studio **Settings → Secrets**, add `GOOGLE_SHEETS_WEBHOOK` = `<your /exec Web app URL>`.
8. Verify by opening `<your /exec URL>?action=health` (or checking logs after submitting a form).
