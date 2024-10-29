/* 

  payload can be an object or an array of objects of any schema
  - deeper nested JSON will be stringified in a cell, not spread across the csv

*/


class SheetLogs {
  constructor() {
    this.loud = false;
    this.logPayload = false;
    this.contentType = 'application/json';
    this.sheet = "Logs";
    this.method = "POST";

    if (typeof process !== 'undefined') {
      this.loadDotenv();
    } else {
      this.contentType = 'application/x-www-form-urlencoded';
      if (this.loud) {
        console.log('Browser mode: set a custom sheetUrl');
      }
    }
  }

  loadDotenv() {
    try {
      const { config } = require('dotenv');
      config();
      this.SHEET_URL = process.env['SHEET_URL'];
    } catch (error) {
      // console.warn('dotenv not found or failed to load. Proceeding without it.');
    }
  }

  setup({ sheetUrl, logPayload, sheet, method }) {
    this.SHEET_URL = sheetUrl !== undefined ? sheetUrl : this.SHEET_URL;
    this.logPayload = logPayload !== undefined ? logPayload : this.logPayload;
    this.sheet = sheet !== undefined ? sheet : this.sheet;
    this.method = method !== undefined ? method : this.method;
  }

  async log(payload, { sheet, sheetUrl, method, id, idColumn, ...rest } = {}) {
    sheet = sheet || this.sheet;
    let data;
    try {
      if (!this.SHEET_URL && !sheetUrl) {
        throw new Error('SHEET_URL not set');
        return;
      }

      const bodyObject = {
        "method": method || this.method,
        "sheet": sheet,
        "payload": payload,
        ...rest
      };
      if (id) bodyObject.id = id;
      if (idColumn) bodyObject.idColumn = idColumn;

      const response = await fetch(this.SHEET_URL || sheetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify(bodyObject)
      });

      try {
        data = await response.json();
      } catch (e) { }
      if (this.logPayload) {
        console.log(bodyObject);
      }
    } finally {
      // semaAdd.release();
    }
    return data;
  }

  // Wrapper methods for each case in sheetlogs.js
  async get(id, options = {}) {
    return this.log({}, { ...options, method: "GET", id });
  }

  async paginatedGet(options = {}) {
    return this.log({}, { ...options, method: "PAGINATED_GET" });
  }

  async post(payload, options = {}) {
    return this.log(payload, { ...options, method: "POST" });
  }

  async batchUpdate(payload, options = {}) {
    return this.log(payload, { ...options, method: "BATCH_UPDATE" });
  }

  async bulkDelete(ids, options = {}) {
    return this.log({}, { ...options, method: "BULK_DELETE", ids });
  }

  async aggregate(column, operation, options = {}) {
    return this.log({}, { ...options, method: "AGGREGATE", column, operation });
  }

  async exportData(format, options = {}) {
    return this.log({}, { ...options, method: "EXPORT", format });
  }

  async upsert(idColumn, id, payload, options = {}) {
    return this.log(payload, { ...options, method: "UPSERT", idColumn, id });
  }

  async dynamicPost(payload, options = {}) {
    return this.log(payload, { ...options, method: "DYNAMIC_POST" });
  }

  async put(id, payload, options = {}) {
    return this.log(payload, { ...options, method: "PUT", id });
  }

  async delete(id, options = {}) {
    return this.log({}, { ...options, method: "DELETE", id });
  }

  async addColumn(columnName, options = {}) {
    return this.log({}, { ...options, method: "ADD_COLUMN", columnName });
  }

  async editColumn(oldColumnName, newColumnName, options = {}) {
    return this.log({}, { ...options, method: "EDIT_COLUMN", oldColumnName, newColumnName });
  }

  async removeColumn(columnName, options = {}) {
    return this.log({}, { ...options, method: "REMOVE_COLUMN", columnName });
  }

  async find(idColumn, id, returnAllMatches = false, options = {}) {
    return this.log({}, { ...options, method: "FIND", idColumn, id, returnAllMatches });
  }

  async rangeUpdate(data, { sheet, startRow, startCol, ...options } = {}) {
    return this.log(data, { 
      ...options, 
      method: "RANGE_UPDATE",
      sheet,
      startRow,
      startCol
    });
  }

  async getRows({ startRow, endRow, sheet, ...options } = {}) {
    return this.log({}, {
      ...options,
      method: "GET_ROWS",
      sheet,
      startRow,
      endRow
    });
  }

  async getColumns({ startColumn, endColumn, sheet, ...options } = {}) {
    return this.log({}, {
      ...options,
      method: "GET_COLUMNS",
      sheet,
      startColumn,
      endColumn
    });
  }

  async getAllCells(options = {}) {
    return this.log({}, {
      ...options,
      method: "GET_ALL_CELLS"
    });
  }

  async export({ format = 'json', sheet, ...options } = {}) {
    return this.log({}, {
      ...options,
      method: "EXPORT",
      sheet,
      format
    });
  }

  async aggregate(column, operation, { where, sheet, ...options } = {}) {
    return this.log({}, {
      ...options,
      method: "AGGREGATE",
      sheet,
      column,
      operation,
      where
    });
  }

  async paginatedGet({ cursor, limit = 10, sortBy = 'Date Modified', sortDir = 'desc', sheet, ...options } = {}) {
    return this.log({}, {
      ...options,
      method: "PAGINATED_GET",
      sheet,
      cursor,
      limit,
      sortBy,
      sortDir
    });
  }

  async batchUpdate(updates, { sheet, ...options } = {}) {
    return this.log(updates, {
      ...options,
      method: "BATCH_UPDATE",
      sheet
    });
  }

  async dynamicPost(payload, { sheet, ...options } = {}) {
    return this.log(payload, {
      ...options,
      method: "DYNAMIC_POST",
      sheet
    });
  }
}

export { SheetLogs };
export default new SheetLogs();

