/*

  SHEET Logger

  - this is heavily modified SpreadAPI

*/

// THIS IS UNSAFE, FOR DEMO PROTOTYPING ONLY
User("anonymous", UNSAFE(""), ALL);


/*
 * SpreadAPI 1.0, created by Mateusz Zieliński
 * Home page: https://spreadapi.com
 * Sponsored by: https://roombelt.com
 * License: Apache 2.0
 */


/* 
 * Configure authentication below 
 * Learn more at docs.spreadapi.com
 */

// Admin account that has read/write access to all sheets
// User("admin", "mysecretPASSw0rd!", ALL);

// User account that can add entries to the "transactions" sheet
// User("user", "Passw0rd!", { transactions: POST });

// User account that can add entries to the "transactions" sheet and read from "summary"
// User("user", "Passw0rd!", { transactions: POST, summary: GET });

// Anonymous account that has write access to a specified sheet
// User("anonymous", UNSAFE(""), { transactions: POST });

// Anonymous account that has read/write access to all sheets (NOT RECOMMENDED!)
// User("anonymous", UNSAFE(""), GET);

// Anonymous account that has read access to all sheets (NOT RECOMMENDED!)
// User("anonymous", UNSAFE(""), GET);

/*
 * Copyright 2019 Mateusz Zieliński
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @OnlyCurrentDoc
 */

function doPost(request) {
  try {
    var requestData = JSON.parse(request.postData.contents);
  } catch (e) {
    return httpResponse(
      error(400, "invalid_post_payload", {
        payload: request.postData.contents,
        type: request.postData.type
      })
    );
  }

  if (Array.isArray(requestData)) {
    return httpResponse(requestData.map(handleRequest));
  }

  return httpResponse(handleRequest(requestData));
}

function handleRequest(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetName = (params.sheet || "").toLowerCase();
  const _id = params.id == null ? null : +params.id; // row number; not the query id
  const method = (params["method"] || "GET").toUpperCase();
  const key = params.key || "";

  const id = params.id || ""; // used for upsert and find
  const idColumn = params.idColumn || ""; // used for upsert and find

  if (!hasAccess(key, sheetName, method)) {
    return error(401, "unauthorized", {});
  }

  if (!isStrongKey(key)) {
    return error(401, "weak_key", {
      message:
        "Authentication key should be at least 8 characters long " +
        "and contain at least one lower case, upper case, number and special character. " +
        "Update your password or mark it as UNSAFE. Refer to the documentation for details."
    });
  }

  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return error(404, "sheet_not_found", { sheet: sheetName });
  }

  if (_id != null && _id <= 1) {
    return error(400, "row_index_invalid", { _id: _id });
  }

  const payload = params["payload"];

  switch (method) {
    case "GET":
      return _id != null
        ? handleGetSingleRow(sheet, _id)
        : handleGetMultipleRows(sheet, params);
    case "POST":
      return handlePost(sheet, payload);
    case "UPSERT":
      return handleUpsert(sheet, idColumn, id, payload);
    case "DYNAMIC_POST":
      return handleDynamicPost(sheet, payload);
    case "PUT":
      return handlePut(sheet, _id, payload);
    case "DELETE":
      return handleDelete(sheet, _id);
    case "ADD_COLUMN":
      return handleAddColumn(sheet, params.columnName);
    case "EDIT_COLUMN":
      return handleEditColumn(sheet, params.oldColumnName, params.newColumnName);
    case "REMOVE_COLUMN":
      return handleRemoveColumn(sheet, params.columnName);
    case "FIND":
      const returnAllMatches = params.returnAllMatches || false;
      return handleFind(sheet, idColumn, id, returnAllMatches);
    default:
      return error(404, "unknown_method", { method: method });
  }
}

function handleGetSingleRow(sheet, _id) {
  const lastColumn = sheet.getLastColumn();
  const headers = getHeaders(sheet);

  const rowData = sheet.getRange(_id, 1, 1, lastColumn).getValues()[0];
  const result = mapRowToObject(rowData, _id, headers);

  if (!result) {
    return error(404, "row_not_found", { _id: _id });
  }

  return data(200, result);
}

function handleGetMultipleRows(sheet, params) {
  const lastColumn = sheet.getLastColumn();
  const headers = getHeaders(sheet);

  const firstRow = 2;
  const lastRow = sheet.getLastRow();
  const total = Math.max(lastRow - firstRow + 1, 0);
  const limit = params.limit != null ? +params.limit : total;

  const isAsc =
    typeof params.order !== "string" || params.order.toLowerCase() !== "desc";

  if (isNaN(limit) || limit < 0) {
    return error(404, "invalid_limit", { limit: limit });
  }

  var firstRowInPage = isAsc ? firstRow : lastRow - limit + 1;
  if (params.start_id != null) {
    const start_id = +params.start_id;

    if (start_id < firstRow || start_id > lastRow) {
      return error(404, "start_id_out_of_range", { start_id: start_id });
    }

    firstRowInPage = start_id - (isAsc ? 0 : limit - 1);
  }

  const lastRowInPage = Math.min(firstRowInPage + limit - 1, lastRow);
  firstRowInPage = Math.max(firstRowInPage, firstRow);

  if (firstRowInPage > lastRowInPage) {
    return data(200, []);
  }

  const rows = sheet
    .getRange(firstRowInPage, 1, lastRowInPage - firstRowInPage + 1, lastColumn)
    .getValues()
    .map(function (item, index) {
      return mapRowToObject(item, firstRowInPage + index, headers);
    });

  if (!isAsc) {
    rows.reverse();
  }

  var next = isAsc ? lastRowInPage + 1 : firstRowInPage - 1;
  if (next < firstRow || next > lastRow) next = undefined;

  return data(200, rows.filter(isTruthy), { next: next });
}



function addNewColumnsIfNeeded(sheet, objects) {
  const existingHeaders = getHeaders(sheet);
  const newColumns = [];

  // Ensure "Date Modified" is always the first column
  if (existingHeaders[0] !== "Date Modified") {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue("Date Modified");
  }

  objects.forEach(obj => {
    Object.keys(obj).forEach(key => {
      if (!existingHeaders.includes(key) && !newColumns.includes(key)) {
        newColumns.push(key);
      }
    });
  });

  newColumns.forEach(columnName => {
    const lastColumn = sheet.getLastColumn();
    sheet.insertColumnAfter(lastColumn);
    sheet.getRange(1, lastColumn + 1).setValue(columnName);
  });
}

function handlePost(sheet, payload) {
  const headers = getHeaders(sheet);
  const currentDate = new Date();
  // Format the current date to include it in the first column
  const formattedDate = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), "MM/dd/yyyy HH:mm:ss");

  // First, map the payload to the row based on headers
  let row = mapObjectToRow(payload, headers.slice(1)); // Exclude the first header for the date

  // Then, prepend the formatted date to the beginning of the row array
  row.unshift(formattedDate);

  sheet.appendRow(row);
  return data(201);
}

function handleDynamicPost(sheet, payload) {
  if (!Array.isArray(payload)) {
    payload = [payload];
  }

  addNewColumnsIfNeeded(sheet, payload);

  const headers = getHeaders(sheet);
  const currentDate = new Date();

  // Pre-process payload to stringify any nested objects
  const processedPayload = payload.map(obj =>
    Object.keys(obj).reduce((acc, key) => {
      acc[key] = typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key];
      return acc;
    }, {})
  );

  processedPayload.forEach(obj => {
    // Create a row array with the date in the first column
    const row = [Utilities.formatDate(currentDate, Session.getScriptTimeZone(), "MM/dd/yyyy HH:mm:ss")];
    headers.slice(1).forEach(header => row.push(obj[header] || ""));
    sheet.appendRow(row);
  });

  return data(201);
}

function handlePut(sheet, _id, payload) {
  if (_id == null) {
    return error(400, "row_id_missing", {});
  }

  const headers = getHeaders(sheet);
  for (const [key, value] of Object.entries(payload)) {
    const idx = headers.findIndex(h => h === key);
    if (idx === -1) continue;

    sheet.getRange(_id, idx + 1, 1).setValue(value);
  }

  return data(201);
}

function handleUpsert(sheet, idColumn, _id, payload) {
  const headers = getHeaders(sheet);
  const idColumnIndex = headers.indexOf(idColumn) + 1; // +1 because SpreadsheetApp is 1-indexed
  if (idColumnIndex < 1) {
    return error(400, "id_column_not_found", { idColumn: idColumn });
  }

  const lastRow = sheet.getLastRow();
  let foundRow = null;
  for (let i = 2; i <= lastRow; i++) { // Start from row 2 to skip headers
    const cellValue = sheet.getRange(i, idColumnIndex).getValue();
    if (cellValue.toString() === _id.toString()) {
      foundRow = i;
      break;
    }
  }

  const currentDate = new Date();
  const formattedDate = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), "MM/dd/yyyy HH:mm:ss");

  if (foundRow) {
    // Update existing row
    const rowValues = mapObjectToRow(payload, headers.slice(1)); // Exclude the first header for the date
    rowValues.unshift(formattedDate); // Prepend the formatted date to the beginning of the row array
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    return data(200, { message: "Row updated" });
  } else {
    // Insert new row
    addNewColumnsIfNeeded(sheet, [payload]);
    const processedPayload = processPayloadForInsertion(payload, headers.slice(1)); // Exclude the first header for the date
    processedPayload.unshift(formattedDate); // Prepend the formatted date to the beginning of the row array
    sheet.appendRow(processedPayload);
    return data(201, { message: "Row inserted" });
  }
}

function processPayloadForInsertion(payload, headers) {
  // Pre-process payload to stringify any nested objects and match headers
  const processedPayload = headers.map(header => {
    const value = payload[header];
    return typeof value === 'object' ? JSON.stringify(value) : (value || "");
  });
  return processedPayload;
}

function handleDelete(sheet, _id) {
  sheet.getRange("$" + _id + ":" + "$" + _id).setValue("");
  return data(204);
}

function handleAddColumn(sheet, columnName) {
  if (!columnName) {
    return error(400, "column_name_missing", {});
  }
  const lastColumn = sheet.getLastColumn();
  sheet.insertColumnAfter(lastColumn);
  sheet.getRange(1, lastColumn + 1).setValue(columnName);
  return data(201, { message: "Column added" });
}

function handleEditColumn(sheet, oldColumnName, newColumnName) {
  const headers = getHeaders(sheet);
  const columnIndex = headers.indexOf(oldColumnName) + 1;
  if (columnIndex < 1) {
    return error(404, "column_not_found", { oldColumnName: oldColumnName });
  }
  sheet.getRange(1, columnIndex).setValue(newColumnName);
  return data(201, { message: "Column renamed" });
}

function handleRemoveColumn(sheet, columnName) {
  const headers = getHeaders(sheet);
  const columnIndex = headers.indexOf(columnName) + 1;
  if (columnIndex < 1) {
    return error(404, "column_not_found", { columnName: columnName });
  }
  sheet.deleteColumn(columnIndex);
  return data(204, { message: "Column removed" });
}

function handleFind(sheet, idColumn, id, returnAllMatches = false) {
  const headers = getHeaders(sheet);
  const idColumnIndex = headers.indexOf(idColumn) + 1; // +1 because SpreadsheetApp is 1-indexed
  if (idColumnIndex < 1) {
    return error(400, "id_column_not_found", { idColumn: idColumn });
  }

  const lastRow = sheet.getLastRow();
  const matches = [];
  for (let i = 2; i <= lastRow; i++) { // Start from row 2 to skip headers
    const cellValue = sheet.getRange(i, idColumnIndex).getValue();
    if (cellValue.toString() === id.toString()) {
      const rowData = sheet.getRange(i, 1, 1, sheet.getLastColumn()).getValues()[0];
      const result = mapRowToObject(rowData, i, headers);
      matches.push(result);
      if (!returnAllMatches) break; // If not returning all matches, break after the first match
    }
  }

  if (matches.length === 0) {
    return error(404, "no_matches_found", {});
  } else if (matches.length === 1 && !returnAllMatches) {
    return data(200, matches[0]); // Return the first match as an object
  } else {
    return data(200, matches); // Return all matches as an array
  }
}

// HTTP utils

function httpResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function error(status, code, details) {
  return {
    status: status,
    error: { code: code, details: details }
  };
}

function data(status, data, params) {
  params = params || {};
  const result = { status: status, data: data };
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      result[key] = params[key];
    }
  }
  return result;
}

// Utils

function getHeaders(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = headers.length - 1; i >= 0; i--) {
    if (!isEmpty(headers[i])) return headers.slice(0, i + 1);
  }
  return [];
}

function isTruthy(x) {
  return !!x;
}

function isEmpty(item) {
  return item === "" || item == null;
}

function find(array, predicate) {
  if (!Array.isArray(array)) return;

  for (var i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
}

function mapObjectToRow(object, headers) {
  return headers.map(header => {
    const value = object[header];
    // Check if the value is an object or an array (but not null)
    if (value && typeof value === 'object') {
      // Convert the object or array to a JSON string
      return JSON.stringify(value);
    }
    return value || "";
  });
}



function mapRowToObject(row, _id, headers) {
  if (row.every(isEmpty)) {
    return null;
  }

  const result = { _id: _id };
  for (var i = 0; i < headers.length; i++) {
    if (!isEmpty(headers[i])) {
      result[headers[i]] = row[i];
    }
  }
  return result;
}

// Permissions & security

var users;
function User(name, key, permissions) {
  if (!users) {
    users = [];
  }
  users.push({ name: name, key: key, permissions: permissions });
}

function getUserWithKey(key) {
  return find(users, function (x) {
    return x.key === key || (typeof x === "object" && x.key.__unsafe === key);
  });
}

function isStrongKey(key) {
  const strongKeyRegex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\x20-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E])(?=.{8,})"
  );
  const user = getUserWithKey(key);

  if (!user) return false;
  if (user.key.__unsafe === key) return true;

  return user.key.match(strongKeyRegex);
}

function getPermissions(user, spreadsheet) {
  if (Array.isArray(user.permissions)) return user.permissions;
  if (typeof user.permissions === "function") return user.permissions;

  const keys = Object.keys(user.permissions);

  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === spreadsheet.toLowerCase()) {
      return user.permissions[keys[i]];
    }
  }

  return user.permissions["ALL"];
}

function hasAccess(key, spreadsheet, method) {
  const user = getUserWithKey(key);

  if (!user) return false;
  const permission = getPermissions(user, spreadsheet);
  if (!permission) return false;

  return !!(
    permission === ALL ||
    permission.toString() === method ||
    find(permission, function (x) {
      return x === ALL;
    }) ||
    find(permission, function (x) {
      return x.toString() === method;
    })
  );
}

function GET() { }
function POST() { }
function PUT() { }
function DELETE() { }
function ALL() { }
function UNSAFE(key) {
  return { __unsafe: key };
}

GET.toString = function () {
  return "GET";
};
POST.toString = function () {
  return "POST";
};
PUT.toString = function () {
  return "PUT";
};
DELETE.toString = function () {
  return "DELETE";
};
ALL.toString = function () {
  return "*";
};








// this isn't SpreadAPI anymore; custom code

function doGet(e) {
  // 'e' contains the request parameters
  try {
    // Since it's a GET request, the parameters are not in the POST body but in the query string
    var params = e.parameter;
    return httpResponse(handleRequest(params));
  } catch (error) {
    // Log the error message and return a 500 Internal Server Error
    Logger.log(error.message);
    return httpResponse(error(500, 'internal_error', { message: error.message }));
  }
}

function onEdit(e) {
  var lastModifiedColumnIndex = 1; // Assuming the "Last Modified" column is A (index 1)

  var range = e.range;
  var sheet = range.getSheet();
  var startRow = range.getRow();
  var numRows = range.getNumRows();

  // Skip the header row if included in the edited range
  if (startRow == 1) {
    startRow = 2;
    numRows--; // Adjust the number of rows to iterate over
  }

  // Check if the edited range intersects with the "Last Modified" column
  var column = range.getColumn();
  if (column === lastModifiedColumnIndex) {
    return; // Exit if the edit is in the "Last Modified" column to avoid circular references
  }

  var timestamp = new Date();
  for (var i = 0; i < numRows; i++) {
    // Set the timestamp for each row in the range, skipping the header
    var row = startRow + i;
    sheet.getRange(row, lastModifiedColumnIndex).setValue(timestamp);
  }
}




