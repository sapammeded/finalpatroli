# FinalPatroli GPS Usage Monitor

This Apps Script is configured to use the exact spreadsheet ID supplied by the owner:
`1Jcj-52qqQNbU_vLhK9YY8KZWJKBE5H6cLhB6c5nEA48`

It only creates/uses a tab named `GPS_USAGE`; it does not clear or edit other tabs. Make sure you want GPS records stored in this spreadsheet and that its sharing permissions are appropriate.

## Setup
1. Create a Google Apps Script project at https://script.google.com/.
2. Add `Code.gs` and paste the code in this folder.
3. Add an HTML file named exactly `Admin` and paste `Admin.html`.
4. In **Project Settings → Script Properties**, add `ADMIN_PASSWORD` with a strong, unique password.
5. Run `setupMonitor()` once and authorize access. It creates the `GPS_USAGE` tab if needed.
6. Deploy → **New deployment → Web app**. Choose **Execute as: Me**. Configure access to allow the app to submit records while protecting the admin view.
7. Copy the deployment URL ending in `/exec`. Replace `PASTE_DEPLOYED_WEB_APP_URL_HERE` in the draft branch's `index.html` with that URL.
8. Test on your own phone first. Open FinalPatroli, choose to share location, allow browser GPS, and verify a row appears in `GPS_USAGE`.

## Data saved
Timestamp, random device ID, latitude, longitude, accuracy, page name, consent status. The monitor is not background tracking. The app only requests GPS after the user opts in and grants browser permission.

## Important
- The live `main` branch is unchanged; this is still a draft until reviewed and merged.
- This script uses the supplied spreadsheet ID and does not connect to other projects/databases.
- The spreadsheet may contain other data in other tabs; the script only accesses the `GPS_USAGE` tab.
- Use a strong admin password and review spreadsheet sharing settings before collecting real users' location.
- Free usage is subject to Google's quotas.
