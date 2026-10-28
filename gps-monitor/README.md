# FinalPatroli GPS Usage Monitor (standalone)

This is an independent Google Apps Script + Google Sheets option for FinalPatroli only. It does not use or connect to any other Supabase project or database.

## Important
- GPS collection must be disclosed to app users and only run after their explicit consent.
- Browser location permission does not automatically send coordinates to a server.
- This folder is a backend/admin draft. The existing `index.html` has NOT been changed, so no GPS collection is active yet.
- Do not store patrol evidence, photos, or unrelated records in this spreadsheet.

## Setup (free-tier Google account usage; subject to Google's quotas)
1. Create a new, dedicated Google Apps Script project and paste `Code.gs`.
2. Add an HTML file named `Admin` and paste `Admin.html`.
3. In **Project Settings → Script Properties**, add `ADMIN_PASSWORD` with a strong, unique password.
4. Run `setupMonitor()` once and approve the requested Google permissions. It creates a dedicated spreadsheet named `FinalPatroli GPS Usage` unless you explicitly set a new dedicated spreadsheet ID in `SPREADSHEET_ID`.
5. Deploy → New deployment → Web app. Execute as **Me**. The web app must be reachable for app submissions; protect admin data with the password. Copy the deployment URL.
6. Only after the backend URL is ready, integrate the app with a visible consent prompt and send coordinates only when the user chooses **Izinkan**. Do not enable background tracking.

## Data fields
Timestamp, random device ID, latitude, longitude, reported accuracy, page name, and consent status. No name, phone number, or patrol photos are collected by this monitor.

## Limits / safety
- GPS accuracy depends on device, browser, signal, and user permission.
- A point is recorded only when the app requests location while open and the user grants permission; this is not continuous tracking.
- Google quotas and policies may change. Do not promise unlimited use.
- Use a separate spreadsheet and Apps Script project for this monitor only.
