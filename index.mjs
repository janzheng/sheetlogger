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

const SheetLogsSchemas = {
  get: {
    input: {
      type: "object",
      properties: {
        id: { 
          oneOf: [
            { type: "string" },
            { type: "number" }
          ]
        },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["id"]
    },
    output: {
      type: "object",
      additionalProperties: true
    }
  },
  paginatedGet: {
    input: {
      type: "object",
      properties: {
        cursor: { type: "string" },
        limit: { type: "number", default: 10 },
        sortBy: { type: "string", default: "Date Modified" },
        sortDir: { 
          type: "string", 
          enum: ["asc", "desc"],
          default: "desc"
        },
        sheet: { type: "string" },
        sheetUrl: { type: "string" }
      },
      additionalProperties: false
    },
    output: {
      type: "object",
      properties: {
        data: { type: "array" },
        nextCursor: { type: "string" }
      },
      required: ["data"]
    }
  },
  post: {
    input: {
      type: "object",
      properties: {
        payload: {
          oneOf: [
            { type: "object" },
            { 
              type: "array",
              items: { type: "object" }
            }
          ]
        },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          }
        }
      },
      required: ["payload"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        id: { type: "string" }
      },
      required: ["success"]
    }
  },
  batchUpdate: {
    input: {
      type: "object",
      properties: {
        updates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                oneOf: [
                  { type: "string" },
                  { type: "number" }
                ]
              },
              data: { type: "object" }
            },
            required: ["id", "data"]
          }
        }
      },
      required: ["updates"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        updatedCount: { type: "number" }
      },
      required: ["success", "updatedCount"]
    }
  },
  bulkDelete: {
    input: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: {
            oneOf: [
              { type: "string" },
              { type: "number" }
            ]
          }
        },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["ids"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        deletedCount: { type: "number" }
      },
      required: ["success", "deletedCount"]
    }
  },
  aggregate: {
    input: {
      type: "object",
      properties: {
        column: { type: "string" },
        operation: { 
          type: "string",
          enum: ["sum", "avg", "count", "min", "max"]
        },
        where: { 
          type: "object",
          additionalProperties: true
        },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["column", "operation"]
    },
    output: {
      type: "object",
      properties: {
        result: { type: "number" }
      },
      required: ["result"]
    }
  },
  upsert: {
    input: {
      type: "object",
      properties: {
        idColumn: { type: "string" },
        id: {
          oneOf: [
            { type: "string" },
            { type: "number" }
          ]
        },
        payload: { type: "object" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["idColumn", "id", "payload"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        action: {
          type: "string",
          enum: ["insert", "update"]
        }
      },
      required: ["success", "action"]
    }
  },
  dynamicPost: {
    input: {
      type: "object",
      properties: {
        payload: {
          oneOf: [
            { type: "object" },
            { 
              type: "array",
              items: { type: "object" }
            }
          ]
        },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["payload"]
    },
    output: {
      type: "object",
      additionalProperties: true
    }
  },
  put: {
    input: {
      type: "object",
      properties: {
        id: {
          oneOf: [
            { type: "string" },
            { type: "number" }
          ]
        },
        payload: { type: "object" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["id", "payload"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" }
      },
      required: ["success"]
    }
  },
  delete: {
    input: {
      type: "object",
      properties: {
        id: {
          oneOf: [
            { type: "string" },
            { type: "number" }
          ]
        },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["id"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" }
      },
      required: ["success"]
    }
  },
  addColumn: {
    input: {
      type: "object",
      properties: {
        columnName: { type: "string" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["columnName"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" }
      },
      required: ["success"]
    }
  },
  editColumn: {
    input: {
      type: "object",
      properties: {
        oldColumnName: { type: "string" },
        newColumnName: { type: "string" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["oldColumnName", "newColumnName"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" }
      },
      required: ["success"]
    }
  },
  removeColumn: {
    input: {
      type: "object",
      properties: {
        columnName: { type: "string" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["columnName"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" }
      },
      required: ["success"]
    }
  },
  find: {
    input: {
      type: "object",
      properties: {
        idColumn: { type: "string" },
        id: {
          oneOf: [
            { type: "string" },
            { type: "number" }
          ]
        },
        returnAllMatches: { type: "boolean" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["idColumn", "id"]
    },
    output: {
      oneOf: [
        { type: "object" },
        { 
          type: "array",
          items: { type: "object" }
        }
      ]
    }
  },
  rangeUpdate: {
    input: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "array",
            items: { type: "any" }
          }
        },
        startRow: { type: "number" },
        startCol: { type: "number" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["data", "startRow", "startCol"]
    },
    output: {
      type: "object",
      properties: {
        success: { type: "boolean" }
      },
      required: ["success"]
    }
  },
  getRows: {
    input: {
      type: "object",
      properties: {
        startRow: { type: "number" },
        endRow: { type: "number" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      }
    },
    output: {
      type: "array",
      items: {
        type: "array",
        items: { type: "any" }
      }
    }
  },
  getColumns: {
    input: {
      type: "object",
      properties: {
        startColumn: { type: "number" },
        endColumn: { type: "number" },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      }
    },
    output: {
      type: "array",
      items: {
        type: "array",
        items: { type: "any" }
      }
    }
  },
  getAllCells: {
    input: {
      type: "object",
      properties: {
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      }
    },
    output: {
      type: "array",
      items: {
        type: "array",
        items: { type: "any" }
      }
    }
  },
  export: {
    input: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["json", "csv", "xlsx"]
        },
        options: {
          type: "object",
          properties: {
            sheet: { type: "string" },
            sheetUrl: { type: "string" }
          },
          additionalProperties: false
        }
      }
    },
    output: {
      oneOf: [
        { type: "string" },
        { type: "object" } // For Buffer/binary data
      ]
    }
  }
};

export { SheetLogs, SheetLogsSchemas };
export default new SheetLogs();

