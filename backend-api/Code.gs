/**
 * Anudip Student Care - Google Apps Script Web App Webhook
 *
 * Connects both existing spreadsheets to server.ts (GOOGLE_SHEETS_WEBHOOK):
 *   1. Responce Table              -> 1eqcD5GyRFexRTgMTFkrBV-CcWpsmEnC2wjLlD_-4X5k
 *   2. Responce_table_For_new_User -> 1ssdr88b1SMyv-qZxQVxceZnfXEvlda8Wd3ol-YCNWkI
 *
 * Guarantees:
 * - Preserves all existing sheet data and Row 1 column headers.
 * - Never overwrites or modifies existing student rows on duplicate logins/submissions.
 * - Uses LockService to prevent concurrent duplicate inserts.
 * - Supports optional WEBHOOK_SECRET via Script Properties.
 */

var CONFIG = {
  EXISTING_STUDENT_SPREADSHEET_ID: '1eqcD5GyRFexRTgMTFkrBV-CcWpsmEnC2wjLlD_-4X5k', // Responce Table
  NEW_STUDENT_SPREADSHEET_ID: '1ssdr88b1SMyv-qZxQVxceZnfXEvlda8Wd3ol-YCNWkI',      // Responce_table_For_new_User

  // Leave blank ('') to automatically use the first existing tab in each spreadsheet,
  // or set an exact tab name (e.g. 'Sheet1') if your workbook has multiple tabs.
  EXISTING_STUDENT_TAB: '',
  NEW_STUDENT_TAB: '',
  SUPPORT_TICKET_TAB: 'Support_Tickets'
};

/**
 * Health check and read-only lookup endpoint.
 * Examples:
 *   GET ?action=health
 *   GET ?action=lookup&studentId=AF05319302&secret=...
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var authError = verifyWebhookSecret_(params.secret || '');
    if (authError) return jsonResponse_(authError, 401);

    var action = String(params.action || 'health').toLowerCase();
    if (action === 'health') {
      return jsonResponse_({
        ok: true,
        service: 'anudip-student-care-apps-script',
        spreadsheets: {
          responceTable: CONFIG.EXISTING_STUDENT_SPREADSHEET_ID,
          newUserTable: CONFIG.NEW_STUDENT_SPREADSHEET_ID
        },
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'lookup') {
      var studentId = String(params.studentId || '').trim().toUpperCase();
      if (!studentId) {
        return jsonResponse_({ ok: false, error: 'Missing studentId parameter' }, 400);
      }
      var found = findExistingStudentById_(studentId);
      return jsonResponse_({
        ok: true,
        found: Boolean(found),
        student: found
      });
    }

    return jsonResponse_({ ok: false, error: 'Unsupported action: ' + action }, 400);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err)
    }, 500);
  }
}

/**
 * Primary webhook receiver for server.ts POST requests.
 * Expected eventType values:
 *   - NEW_STUDENT
 *   - EXISTING_STUDENT
 *   - SUPPORT_TICKET
 *   - LOOKUP_STUDENT (read-only)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'Empty request body' }, 400);
    }

    var payload = JSON.parse(e.postData.contents);
    var authError = verifyWebhookSecret_(payload.secret || '');
    if (authError) return jsonResponse_(authError, 401);

    var eventType = String(payload.eventType || '').trim().toUpperCase();
    if (!eventType) {
      return jsonResponse_({ ok: false, error: 'Missing eventType' }, 400);
    }

    if (eventType === 'NEW_STUDENT') {
      return jsonResponse_(handleNewStudent_(payload));
    }

    if (eventType === 'EXISTING_STUDENT') {
      return jsonResponse_(handleExistingStudent_(payload));
    }

    if (eventType === 'SUPPORT_TICKET') {
      return jsonResponse_(handleSupportTicket_(payload));
    }

    if (eventType === 'LOOKUP_STUDENT') {
      var sid = String(payload.studentId || '').trim().toUpperCase();
      var record = sid ? findExistingStudentById_(sid) : null;
      return jsonResponse_({ ok: true, found: Boolean(record), student: record });
    }

    return jsonResponse_({ ok: false, error: 'Unknown eventType: ' + eventType }, 400);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err)
    }, 500);
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

/**
 * Routes NEW_STUDENT to:
 *   Spreadsheet: Responce_table_For_new_User
 * Deduplicates by Mobile Number (never modifies existing rows).
 */
function handleNewStudent_(payload) {
  var name = String(payload.name || '').trim();
  var mobileNumber = normalizeDigits_(payload.mobileNumber || '');
  var pinCode = normalizeDigits_(payload.pinCode || '');
  var state = String(payload.state || '').trim();
  var timestamp = String(payload.timestamp || new Date().toISOString());

  if (!name || !mobileNumber || !pinCode || !state) {
    return { ok: false, error: 'Missing required NEW_STUDENT fields' };
  }

  var sheet = getTargetSheet_(
    CONFIG.NEW_STUDENT_SPREADSHEET_ID,
    CONFIG.NEW_STUDENT_TAB,
    ['Timestamp', 'Name', 'Mobile Number', 'Pin Code', 'State']
  );

  var headers = readHeaders_(sheet);
  var mobileColIdx = findColumnIndex_(headers, [
    'mobilenumber', 'mobile', 'phoneno', 'phone', 'contactnumber', 'contact'
  ]);

  if (mobileColIdx !== -1 && sheet.getLastRow() > 1) {
    var existingMobiles = sheet.getRange(2, mobileColIdx + 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < existingMobiles.length; i++) {
      if (normalizeDigits_(existingMobiles[i][0]) === mobileNumber) {
        return {
          ok: true,
          spreadsheet: 'Responce_table_For_new_User',
          sheetName: sheet.getName(),
          duplicate: true,
          action: 'preserved_existing'
        };
      }
    }
  }

  var rowValues = buildRowFromHeaders_(headers, {
    timestamp: timestamp,
    name: name,
    mobileNumber: mobileNumber,
    pinCode: pinCode,
    state: state
  });

  sheet.appendRow(rowValues);
  return {
    ok: true,
    spreadsheet: 'Responce_table_For_new_User',
    sheetName: sheet.getName(),
    duplicate: false,
    action: 'appended'
  };
}

/**
 * Routes EXISTING_STUDENT to:
 *   Spreadsheet: Responce Table
 * Deduplicates by Student ID (never modifies existing student records).
 */
function handleExistingStudent_(payload) {
  var name = String(payload.name || '').trim();
  var mobileNumber = normalizeDigits_(payload.mobileNumber || '');
  var studentId = String(payload.studentId || '').trim().toUpperCase();
  var timestamp = String(payload.timestamp || new Date().toISOString());

  if (!name || !studentId) {
    return { ok: false, error: 'Missing required EXISTING_STUDENT fields' };
  }

  var sheet = getTargetSheet_(
    CONFIG.EXISTING_STUDENT_SPREADSHEET_ID,
    CONFIG.EXISTING_STUDENT_TAB,
    ['Timestamp', 'Name', 'CMIS Register Mobile Number', 'Student ID']
  );

  var headers = readHeaders_(sheet);
  var studentIdColIdx = findColumnIndex_(headers, [
    'studentid', 'student_id', 'af0id', 'id', 'cmisid', 'registrationid'
  ]);

  if (studentIdColIdx !== -1 && sheet.getLastRow() > 1) {
    var existingIds = sheet.getRange(2, studentIdColIdx + 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < existingIds.length; i++) {
      if (String(existingIds[i][0] || '').trim().toUpperCase() === studentId) {
        return {
          ok: true,
          spreadsheet: 'Responce Table',
          sheetName: sheet.getName(),
          duplicate: true,
          action: 'preserved_existing'
        };
      }
    }
  }

  var rowValues = buildRowFromHeaders_(headers, {
    timestamp: timestamp,
    name: name,
    mobileNumber: mobileNumber,
    studentId: studentId
  });

  sheet.appendRow(rowValues);
  return {
    ok: true,
    spreadsheet: 'Responce Table',
    sheetName: sheet.getName(),
    duplicate: false,
    action: 'appended'
  };
}

/**
 * Routes SUPPORT_TICKET to a dedicated Support_Tickets tab inside Responce Table,
 * leaving existing student response tabs untouched.
 */
function handleSupportTicket_(payload) {
  var ticketId = String(payload.ticketId || '').trim();
  var studentName = String(payload.studentName || '').trim();
  var studentId = payload.studentId ? String(payload.studentId).trim().toUpperCase() : '';
  var subject = String(payload.subject || '').trim();
  var message = String(payload.message || '').trim();
  var hasAttachment = Boolean(payload.hasAttachment);
  var timestamp = String(payload.timestamp || new Date().toISOString());

  if (!ticketId || !subject || !message) {
    return { ok: false, error: 'Missing required SUPPORT_TICKET fields' };
  }

  var sheet = getTargetSheet_(
    CONFIG.EXISTING_STUDENT_SPREADSHEET_ID,
    CONFIG.SUPPORT_TICKET_TAB,
    ['Timestamp', 'Ticket ID', 'Student Name', 'Student ID', 'Subject', 'Message', 'Has Attachment']
  );

  var headers = readHeaders_(sheet);
  var ticketColIdx = findColumnIndex_(headers, ['ticketid', 'ticket']);
  if (ticketColIdx !== -1 && sheet.getLastRow() > 1) {
    var existingTickets = sheet.getRange(2, ticketColIdx + 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < existingTickets.length; i++) {
      if (String(existingTickets[i][0] || '').trim() === ticketId) {
        return {
          ok: true,
          spreadsheet: 'Responce Table',
          sheetName: sheet.getName(),
          duplicate: true,
          action: 'preserved_existing'
        };
      }
    }
  }

  var rowValues = buildRowFromHeaders_(headers, {
    timestamp: timestamp,
    ticketId: ticketId,
    studentName: studentName,
    name: studentName,
    studentId: studentId,
    subject: subject,
    message: message,
    hasAttachment: hasAttachment ? 'Yes' : 'No'
  });

  sheet.appendRow(rowValues);
  return {
    ok: true,
    spreadsheet: 'Responce Table',
    sheetName: sheet.getName(),
    duplicate: false,
    action: 'appended'
  };
}

/**
 * Read-only lookup inside Responce Table by Student ID.
 */
function findExistingStudentById_(studentId) {
  var ss = SpreadsheetApp.openById(CONFIG.EXISTING_STUDENT_SPREADSHEET_ID);
  var sheet = CONFIG.EXISTING_STUDENT_TAB
    ? ss.getSheetByName(CONFIG.EXISTING_STUDENT_TAB)
    : ss.getSheets()[0];
  if (!sheet || sheet.getLastRow() <= 1) return null;

  var headers = readHeaders_(sheet);
  var idCol = findColumnIndex_(headers, ['studentid', 'student_id', 'af0id', 'id', 'cmisid']);
  if (idCol === -1) return null;

  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol] || '').trim().toUpperCase() === studentId) {
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        obj[headers[c]] = data[r][c];
      }
      return obj;
    }
  }
  return null;
}

// ---- Sheet & Header Helpers ----

function getTargetSheet_(spreadsheetId, tabName, defaultHeadersIfEmpty) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = tabName ? ss.getSheetByName(tabName) : ss.getSheets()[0];

  if (!sheet && tabName) {
    sheet = ss.insertSheet(tabName);
  }
  if (!sheet) {
    throw new Error('Target sheet tab not found in spreadsheet: ' + spreadsheetId);
  }

  // Only initialize headers if the sheet is completely blank
  if (sheet.getLastRow() === 0 && defaultHeadersIfEmpty && defaultHeadersIfEmpty.length > 0) {
    sheet.appendRow(defaultHeadersIfEmpty);
  }
  return sheet;
}

function readHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || '').trim();
  });
}

function normalizeHeader_(header) {
  return String(header || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findColumnIndex_(headers, aliases) {
  for (var i = 0; i < headers.length; i++) {
    var norm = normalizeHeader_(headers[i]);
    if (aliases.indexOf(norm) !== -1) {
      return i;
    }
  }
  return -1;
}

function buildRowFromHeaders_(headers, data) {
  return headers.map(function (header) {
    var norm = normalizeHeader_(header);
    if (norm === 'timestamp' || norm === 'date' || norm === 'createdat' || norm === 'submittedat' || norm === 'time') {
      return data.timestamp || '';
    }
    if (norm === 'name' || norm === 'studentname' || norm === 'fullname') {
      return data.name || data.studentName || '';
    }
    if (norm === 'studentid' || norm === 'af0id' || norm === 'cmisid' || norm === 'registrationid' || norm === 'id') {
      return data.studentId || '';
    }
    if (
      norm === 'mobilenumber' ||
      norm === 'mobile' ||
      norm === 'phoneno' ||
      norm === 'phone' ||
      norm === 'contactnumber' ||
      norm === 'cmisregistermobilenumber' ||
      norm === 'cmisregistermobilenumberoptional' ||
      norm === 'cmismobile'
    ) {
      return data.mobileNumber || '';
    }
    if (norm === 'pincode' || norm === 'pin' || norm === 'postalcode' || norm === 'zipcode') {
      return data.pinCode || '';
    }
    if (norm === 'state') {
      return data.state || '';
    }
    if (norm === 'ticketid' || norm === 'ticket') {
      return data.ticketId || '';
    }
    if (norm === 'subject') {
      return data.subject || '';
    }
    if (norm === 'message' || norm === 'query' || norm === 'description' || norm === 'issue') {
      return data.message || '';
    }
    if (norm === 'hasattachment' || norm === 'attachment') {
      return data.hasAttachment || '';
    }
    return '';
  });
}

function normalizeDigits_(val) {
  return String(val || '').replace(/\D/g, '');
}

function verifyWebhookSecret_(providedSecret) {
  var expected = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!expected) return null; // Not set yet -> allow until configured
  if (String(providedSecret || '') !== String(expected)) {
    return { ok: false, error: 'Unauthorized webhook secret' };
  }
  return null;
}

function jsonResponse_(obj, _statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
