# FinalPatroli GPS Usage Monitor (standalone)

This is an independent Google Apps Script + Google Sheets monitor for FinalPatroli only. It does not use or connect to any other Supabase project or database.

## Current state
- The draft branch adds a visible first-use consent prompt to `index.html`.
- The live `main` branch is unchanged. The draft is not merged and GPS collection is not live.
- The app's backend URL is deliberately a placeholder until the dedicated Apps Script web app is deployed.
- Users who decline are not tracked. Users who consent are asked for browser GPS permission. This is not background tracking.

## Deploy the dedicated backend
1. Create a new Google Apps Script project for FinalPatroli GPS only.
2. Create `Code.gs` and paste the contents of this folder's `Code.gs`.
3. Create an HTML file named exactly `Admin` and paste `Admin.html`.
4. Open **Project Settings → Script Properties** and add `ADMIN_PASSWORD` with a strong, unique password.
5. Run `setupMonitor()` once and approve the requested Google permissions. It creates a dedicated spreadsheet named `FinalPatroli GPS Usage` unless you deliberately set `SPREADSHEET_ID` to a new, dedicated spreadsheet. Never point it at another project's data.
6. Deploy → **New deployment → Web app**. Choose **Execute as: Me**. Configure access so the app can submit visits, consistent with your organization's privacy requirements. Copy the deployment URL ending in `/exec`.
7. In `index.html` on the draft branch, replace `PASTE_DEPLOYED_WEB_APP_URL_HERE` with that URL. Do not publish the placeholder as a finished deployment.
8. Test with your own phone first: open the draft, choose **Izinkan lokasi**, allow the browser prompt, then check the `GPS_USAGE` sheet and admin web app. Verify a declined permission sends no record.

## Data fields
Timestamp, random device ID, latitude, longitude, reported accuracy, page name, and consent status. No name, phone number, or patrol photos are collected by this monitor.

## Admin dashboard
Open the deployed Apps Script web app URL, enter the admin password, and use the map/table to inspect the recorded points. The password is checked server-side; login sessions expire after one hour. Do not share the URL/password publicly.

## Limits and privacy
- GPS accuracy depends on the device, browser, signal, and user permission.
- One record is attempted when FinalPatroli is opened after consent and location permission is granted; this is not continuous or background tracking.
- Google quotas and policies may change; free usage is subject to Google limits.
- Use a separate Apps Script project and spreadsheet exclusively for FinalPatroli.
