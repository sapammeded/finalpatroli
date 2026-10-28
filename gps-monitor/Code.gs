/** FinalPatroli — GPS Usage Monitor (standalone Apps Script backend)
 * Deploy as Web App. Set Script Properties:
 *   ADMIN_PASSWORD = a strong password
 *   SPREADSHEET_ID = optional existing NEW/DEDICATED spreadsheet ID; if omitted, script creates one.
 * Never point this to another project's spreadsheet.
 */
function setupMonitor() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_PASSWORD')) {
    throw new Error('Set Script Property ADMIN_PASSWORD first.');
  }
  let id = props.getProperty('SPREADSHEET_ID');
  if (!id) {
    const ss = SpreadsheetApp.create('FinalPatroli GPS Usage');
    id = ss.getId();
    props.setProperty('SPREADSHEET_ID', id);
  }
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName('GPS_USAGE');
  if (!sheet) sheet = ss.insertSheet('GPS_USAGE');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp','Device ID','Latitude','Longitude','Accuracy (m)','Page','Consent']);
    sheet.setFrozenRows(1);
  }
  return {spreadsheetId:id, spreadsheetUrl:ss.getUrl()};
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Admin')
    .setTitle('FinalPatroli — GPS Usage Monitor')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.action !== 'visit' || data.consent !== true) {
      return ContentService.createTextOutput('ignored');
    }
    const lat = Number(data.latitude), lon = Number(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return ContentService.createTextOutput('invalid');
    }
    const ss = getSpreadsheet_();
    let sh = ss.getSheetByName('GPS_USAGE');
    if (!sh) {
      sh = ss.insertSheet('GPS_USAGE');
      sh.appendRow(['Timestamp','Device ID','Latitude','Longitude','Accuracy (m)','Page','Consent']);
      sh.setFrozenRows(1);
    }
    sh.appendRow([
      new Date(),
      String(data.deviceId || '').slice(0, 80),
      lat, lon,
      Math.max(0, Number(data.accuracy) || 0),
      String(data.page || 'FinalPatroli').slice(0, 120),
      'YES'
    ]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  }
}

function adminLogin(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || String(password || '') !== expected) return {ok:false};
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('admin:' + token, '1', 60 * 60);
  return {ok:true, token:token};
}

function getLocations(token) {
  if (!token || CacheService.getScriptCache().get('admin:' + token) !== '1') {
    throw new Error('Sesi admin tidak valid. Silakan login kembali.');
  }
  const sh = getSpreadsheet_().getSheetByName('GPS_USAGE');
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  return values.slice(1).reverse().slice(0, 2000).map(r => ({
    timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ''),
    deviceId: String(r[1] || ''),
    latitude: Number(r[2]),
    longitude: Number(r[3]),
    accuracy: Number(r[4]) || 0,
    page: String(r[5] || '')
  })).filter(x => Number.isFinite(x.latitude) && Number.isFinite(x.longitude));
}

function clearLocations(token) {
  if (!token || CacheService.getScriptCache().get('admin:' + token) !== '1') {
    throw new Error('Sesi admin tidak valid. Silakan login kembali.');
  }
  const sh = getSpreadsheet_().getSheetByName('GPS_USAGE');
  if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  return true;
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Jalankan setupMonitor() setelah mengatur ADMIN_PASSWORD.');
  return SpreadsheetApp.openById(id);
}