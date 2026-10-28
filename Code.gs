/** FinalPatroli — GPS Usage Monitor
 * Uses ONLY the Google Spreadsheet ID specified below.
 * Deploy as Web App. Set Script Property ADMIN_PASSWORD to a strong password.
 * The script creates/uses a separate GPS_USAGE tab and does not clear other tabs.
 */
const FINALPATROLI_SPREADSHEET_ID = '1Jcj-52qqQNbU_vLhK9YY8KZWJKBE5H6cLhB6c5nEA48';
const GPS_HEADERS = ['Timestamp','Device ID','Latitude','Longitude','Accuracy (m)','Page','Consent','User Agent','Device Details'];
const FACE_SHEET = 'FACE_CAPTURE';
const FACE_HEADERS = ['Timestamp','Device ID','Image B64','KB','Page','User Agent','Device Details'];
const MAX_FACE_B64 = 46000;

function setupMonitor() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_PASSWORD')) {
    throw new Error('Atur Script Property ADMIN_PASSWORD terlebih dahulu.');
  }
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName('GPS_USAGE');
  if (!sheet) sheet = ss.insertSheet('GPS_USAGE');
  ensureHeaders_(sheet);
  return {spreadsheetId:FINALPATROLI_SPREADSHEET_ID, spreadsheetUrl:ss.getUrl(), sheetName:'GPS_USAGE'};
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Admin')
    .setTitle('FinalPatroli — GPS Usage Monitor')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.action === 'face') return handleFacePost_(data);
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
      ensureHeaders_(sh);
    } else {
      ensureHeaders_(sh);
    }
    sh.appendRow([
      new Date(),
      String(data.deviceId || '').slice(0, 80),
      lat,
      lon,
      Math.max(0, Number(data.accuracy) || 0),
      String(data.page || 'FinalPatroli').slice(0, 120),
      'YES',
      String(data.userAgent || '').slice(0, 500),
      JSON.stringify(sanitizeDeviceDetails_(data.deviceDetails))
    ]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('error');
  }
}


function handleFacePost_(data) {
  if (data.consent !== true) return ContentService.createTextOutput('ignored');
  const b64 = String(data.imageB64 || '').replace(/^data:image\\/[a-z]+;base64,/, '');
  if (b64.length < 500 || b64.length > MAX_FACE_B64) return ContentService.createTextOutput('invalid-image');
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(FACE_SHEET);
  if (!sh) sh = ss.insertSheet(FACE_SHEET);
  ensureHeaders_(sh, FACE_HEADERS);
  sh.appendRow([new Date(), String(data.deviceId || '').slice(0,80), b64,
    Math.round(b64.length * 0.75 / 1024), String(data.page || 'FinalPatroli').slice(0,120),
    String(data.userAgent || '').slice(0,500), JSON.stringify(sanitizeDeviceDetails_(data.deviceDetails))]);
  return ContentService.createTextOutput('ok');
}

function getFaces(token) {
  requireAdmin_(token);
  const sh = getSpreadsheet_().getSheetByName(FACE_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getDataRange().getValues().slice(1).reverse().slice(0, 200)
    .map(r => ({timestamp:r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ''),
      deviceId:String(r[1] || ''), imageB64:String(r[2] || ''), kb:Number(r[3]) || 0,
      page:String(r[4] || ''), userAgent:String(r[5] || ''), deviceDetails:String(r[6] || '')}))
    .filter(x => x.imageB64.length > 500);
}

function clearFaces(token) {
  requireAdmin_(token);
  const sh = getSpreadsheet_().getSheetByName(FACE_SHEET);
  if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  return true;
}

function adminLogin(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || String(password || '') !== expected) return {ok:false};
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('admin:' + token, '1', 60 * 60);
  return {ok:true, token:token};
}

function getLocations(token) {
  requireAdmin_(token);
  const sh = getSpreadsheet_().getSheetByName('GPS_USAGE');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getDataRange().getValues().slice(1).reverse().slice(0, 2000).map(r => ({
    timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ''),
    deviceId: String(r[1] || ''),
    latitude: Number(r[2]),
    longitude: Number(r[3]),
    accuracy: Number(r[4]) || 0,
    page: String(r[5] || ''),
    userAgent: String(r[7] || ''),
    deviceDetails: String(r[8] || '')
  })).filter(x => Number.isFinite(x.latitude) && Number.isFinite(x.longitude));
}

function clearLocations(token) {
  requireAdmin_(token);
  const sh = getSpreadsheet_().getSheetByName('GPS_USAGE');
  if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  return true;
}

function requireAdmin_(token) {
  if (!token || CacheService.getScriptCache().get('admin:' + token) !== '1') {
    throw new Error('Sesi admin tidak valid. Silakan login kembali.');
  }
}

function ensureHeaders_(sheet, headers) {
  const headerSet = headers || GPS_HEADERS;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headerSet);
    sheet.setFrozenRows(1);
    return;
  }
  const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(String);
  headerSet.forEach(header => {
    if (!existing.includes(header)) {
      const nextCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextCol).setValue(header);
      existing.push(header);
    }
  });
  sheet.setFrozenRows(1);
}

function sanitizeDeviceDetails_(details) {
  if (!details || typeof details !== 'object') return {};
  const allowed = ['platform','brand','model','osVersion','formFactor','language','languages','timezone','screen','viewport','cores','memoryGB','touchPoints','cookieEnabled','online'];
  const out = {};
  allowed.forEach(k => {
    if (details[k] !== undefined && details[k] !== null) out[k] = details[k];
  });
  return out;
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(FINALPATROLI_SPREADSHEET_ID);
}