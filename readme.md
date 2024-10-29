# Sheet.log

Sheet.log is a simple console.log-like logger — think Sentry — to Google Sheets with a modified [SpreadAPI script](https://spreadapi.roombelt.com/).

This is ideal for projects and prototypes where Sentry is too heavy, and you just want a semi-public log dump. Google Sheets is great because they have filtering, formulas, graphing, and more stuff built in. 

Google Sheets supports up to roughly 200,000 cells per sheet (I think), which makes sheet.log perfect for toy projects and MVPs that need a faux, persisted "database"

Sheet.log is built on top of the excellent [SpreadAPI](https://spreadapi.roombelt.com/) library, which is a Google Apps Script library that turns any Google Sheets into a data store.

## Installation

1. Install package: `yarn add --dev @yawnxyz/sheetlog`
2. Create a Google Sheet
3. Follow the [installation instructions for SpreadAPI](https://spreadapi.roombelt.com/setup)
4. Replace the default script with the custom script (spreadapi-custom.js) in this repo
5. Make sure to change the appropriate authentication for your app!!
6. Deploy the app per installation instructions, and get the custom URL.
7. Set that URL to .env.SHEET_URL to your deployed SpreadAPI Apps Script, or with `sheet.setup({sheetUrl: "some url"})`
8. Create a new Google Sheets tab named "Logs"
9. Now you can log any object to your sheet, with `sheet.log({some: "data"})` to your code, and it'll log to the `Logs` sheet!

## Usage

### Quick Start

To start logging data to your Google Sheet:

```javascript
import sheet from '@yawnxyz/sheetlog';
sheet.log({Name: "First Name"});
```

This appends all data to the `Logs` tab, and requires a column named `Name` to exist.

### Basic Methods

#### .log(payload, options)
The `.log` function is used to log data to the specified sheet. It accepts the following parameters:
- `payload`: The data to be logged.
- `options`: An object containing additional options such as `sheet`, `sheetUrl`, `sqid`, `method`, `id`, and `idColumn`.

Example:
```javascript
const payload = { name: 'John', age: 30 };
const options = { sheet: 'Users', method: 'POST' };
sheet.log(payload, options);
```

#### .get(options)
The `.get` function is used to retrieve data from the specified sheet. It supports various query options including pagination, sorting, and filtering.

Example of basic get:
```javascript
const options = {
  limit: 10,
  start_id: 100,
  order: "desc"
};
sheet.get(options);
```

Example of get with `_id`:
```javascript
sheet.get(123); // Fetches the row with ID 123
```

#### .update(payload, options)
The `.update` function is used to update existing data in the specified sheet. It accepts the same parameters as `.log` and sets the method to "UPSERT".

Example:
```javascript
const payload = { id: 123, name: 'Jane', age: 25 };
const options = { sheet: 'Users' };
sheet.update(payload, options);
```

#### .add(payload, options)
The `.add` function is used to add new data to the specified sheet. It accepts the same parameters as `.log`, but turns any new keys in the object into columns.

Example:
```javascript
const payload = { name: 'Alice', age: 28 };
const options = { sheet: 'Users' };
sheet.add(payload, options);
```

#### .find(idColumn, id, returnAllMatches)
The `.find` function is used to find data in the specified sheet based on the provided `idColumn` and `id`. It accepts the `idColumn`, `id`, and `returnAllMatches` parameters.

This method returns an object, but setting `returnAllMatches=true` will instead return an array of all matches.

Example:
```javascript
const idColumn = 'id';
const id = 123;
const returnAllMatches = true;
sheet.find(idColumn, id, returnAllMatches);
```

#### Pagination
```javascript
sheet.log(payload, {
  method: "PAGINATED_GET",
  limit: 20,
  cursor: "100",
  sortBy: "timestamp",
  sortDir: "desc"
});
```

#### Bulk Operations
```javascript
// Batch Update
sheet.log(payload, {
  method: "BATCH_UPDATE",
  payload: [
    { _id: 1, status: "complete" },
    { _id: 2, status: "pending" }
  ]
});

// Bulk Delete
sheet.log(null, {
  method: "BULK_DELETE",
  ids: [1, 2, 3, 4]
});
```

#### Aggregation
```javascript
sheet.log(null, {
  method: "AGGREGATE",
  sheet: "sales",
  column: "amount",
  operation: "sum" // Available: sum, avg, min, max, count
});
```

#### Data Export
```javascript
sheet.log(null, {
  method: "EXPORT",
  format: "csv" // or "json"
});
```

### Column Management

```javascript
// Add new column
sheet.log(null, {
  method: "ADD_COLUMN",
  columnName: "newColumn"
});

// Rename column
sheet.log(null, {
  method: "EDIT_COLUMN",
  oldColumnName: "oldName",
  newColumnName: "newName"
});

// Remove column
sheet.log(null, {
  method: "REMOVE_COLUMN",
  columnName: "columnToRemove"
});
```

### Retrieve Specific Rows

You can retrieve specific rows from a Google Sheet using the `GET_ROWS` method. This method allows you to specify a range of rows to fetch.

**Parameters:**
- `sheet`: The name of the sheet.
- `startRow`: The starting row number (1-indexed).
- `endRow`: (Optional) The ending row number. If not provided, only the `startRow` will be retrieved.

**Example:**
```javascript
{
  method: "GET_ROWS",
  sheet: "logs",
  startRow: 2,
  endRow: 5
}
```

### Retrieve Specific Columns

You can retrieve specific columns from a Google Sheet using the `GET_COLUMNS` method. This method allows you to specify a range of columns to fetch by their letter or number.

**Parameters:**
- `sheet`: The name of the sheet.
- `startColumn`: The starting column identifier (e.g., "A", "G", or 1).
- `endColumn`: (Optional) The ending column identifier. If not provided, only the `startColumn` will be retrieved.

**Example:**
```javascript
{
  method: "GET_COLUMNS",
  sheet: "logs",
  startColumn: "A",
  endColumn: "C"
}
```


## Features

- Simple logging interface with `sheet.log()`
- Automatic timestamp tracking with "Date Modified" column
- Dynamic column creation
- JSON object serialization for nested data
- Multiple authentication methods
- Pagination support
- Bulk operations
- Aggregation functions
- Data export options
- Custom sheet management

## Authentication

SheetLogs supports flexible authentication patterns:

```javascript
const logger = new SheetLogs({
  users: [
    // Admin with full access
    {
      name: "admin",
      key: "myStr0ng!Pass",  // Strong password required
      permissions: "*"       // ALL access
    },

    // Power user with mixed permissions
    {
      name: "poweruser",
      key: "P0wer!User",
      permissions: {
        logs: ["GET", "POST"],     // Multiple methods for one sheet
        analytics: "GET",          // Single method for one sheet
        config: ["PUT", "DELETE"]  // Multiple methods for another sheet
      }
    },

    // Read-only user
    {
      name: "viewer",
      key: "V1ewer!Pass",
      permissions: {
        public: "GET",
        reports: "GET"
      }
    }
  ]
});
```

### Authentication Requirements

Keys must be:
- 8+ characters long
- Include lowercase, uppercase, number, and special character
- Can be marked as `UNSAFE()` to bypass security requirements (development only)

## Available Methods

| Method | Description |
|--------|-------------|
| GET | Fetch single or multiple rows |
| POST | Create new rows |
| PUT | Update existing rows |
| DELETE | Remove rows |
| UPSERT | Create or update based on ID |
| DYNAMIC_POST | Create rows with dynamic columns |
| ADD_COLUMN | Add new columns |
| EDIT_COLUMN | Rename columns |
| REMOVE_COLUMN | Delete columns |
| FIND | Search for specific values |
| BULK_DELETE | Remove multiple rows |
| PAGINATED_GET | Get rows with pagination |
| EXPORT | Export data in different formats |
| AGGREGATE | Perform calculations on columns |
| BATCH_UPDATE | Update multiple rows efficiently |

## Method Index & Examples

```javascript
// Fetch all
{
  "method": "GET",
  "sheet": "testSheet"
}

// Fetch the first row of data (row 1 is the header row since Sheets is 1-indexed)
{
  "method": "GET",
  "sheet": "testSheet",
  "id": 2
}

// Fetch multiple rows with pagination
{
  "method": "GET",
  "sheet": "links",
  "start_id": 2,
  "limit": 5
}

// Create a new row
{
  "method": "POST",
  "sheet": "users",
  "payload": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}

// Create or update a row based on ID
{
  "method": "UPSERT",
  "sheet": "users",
  "idColumn": "userId",
  "id": 123,
  "payload": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}

// Create rows with dynamic columns
{
  "method": "DYNAMIC_POST",
  "sheet": "data",
  "payload": {
    "newField": "newValue",
    "anotherField": "anotherValue"
  }
}

// Update specific fields in a row
{
  "method": "PUT",
  "sheet": "users",
  "id": 123,
  "payload": {
    "email": "newemail@example.com"
  }
}

// Delete a specific row
{
  "method": "DELETE",
  "sheet": "users",
  "id": 123
}

// Add a new column to the sheet
{
  "method": "ADD_COLUMN",
  "sheet": "users",
  "columnName": "newColumn"
}

// Rename an existing column
{
  "method": "EDIT_COLUMN",
  "sheet": "users",
  "oldColumnName": "oldName",
  "newColumnName": "newName"
}

// Remove a column from the sheet
{
  "method": "REMOVE_COLUMN",
  "sheet": "users",
  "columnName": "columnToRemove"
}

// Find rows by a specific column value
{
  "method": "FIND",
  "sheet": "users",
  "idColumn": "email",
  "id": "john@example.com",
  "returnAllMatches": true
}

// Bulk delete multiple rows
{
  "method": "BULK_DELETE",
  "sheet": "users",
  "ids": [1, 2, 3, 4]
}

// Get rows with pagination
{
  "method": "PAGINATED_GET",
  "sheet": "logs",
  "limit": 20,
  "cursor": "100",
  "sortBy": "timestamp",
  "sortDir": "desc"
}

// Export data in a specific format
{
  "method": "EXPORT",
  "sheet": "logs",
  "format": "csv"
}

// Perform aggregation on a column
{
  "method": "AGGREGATE",
  "sheet": "sales",
  "column": "amount",
  "operation": "sum"
}

// Batch update multiple rows
{
  "method": "BATCH_UPDATE",
  "sheet": "logs",
  "payload": [
    { "_id": 1, "status": "complete" },
    { "_id": 2, "status": "pending" }
  ]
}

// Fetch specific rows
{
  "method": "GET_ROWS",
  "sheet": "testSheet",
  "startRow": 2,
  "endRow": 10
}

// Fetch specific columns
{
  "method": "GET_COLUMNS",
  "sheet": "testSheet",
  "startColumn": "B",
  "endColumn": "D"
}

// Fetch a single column
{
  "method": "GET_COLUMNS",
  "sheet": "testSheet",
  "startColumn": "G"
}

// Fetch all cells and data in the sheet
{
  "method": "GET_ALL_CELLS",
  "sheet": "testSheet"
}

// Update a range of cells
{
  "method": "RANGE_UPDATE",
  "sheet": "dynamicSheet", 
  "startRow": 2,
  "startCol": 3,
  "data": [
    ["A1", "B1", "C1"],
    ["A2", "B2", "C2"],
    ["A3", "B3", "C3"]
  ]
}

```