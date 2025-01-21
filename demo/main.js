import { Hono } from "npm:hono";

const app = new Hono();

// Add API endpoints to handle sheet operations
app.post("/api/sheet", async (c) => {
  try {
    const body = await c.req.json();
    const { sheetUrl, payload } = body;
    
    // Default sheet to Sheet1 if not provided
    if (payload.sheet === undefined) {
      payload.sheet = "Sheet1";
    }

    const response = await fetch(sheetUrl, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(text);
    }
    return c.json(data);

  } catch (err) {
    console.error("Error in /api/sheet:", err);
    return c.json({ error: err.message }, 500);
  }
});

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sheetlog Demo</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
  <div x-data="sheetlogDemo" class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Sheetlog Demo</h1>
    
    <div class="bg-white p-6 rounded-lg shadow-md mb-8">
      <p>Sheetlog is a library for logging and retrieving data from Google Sheets. It is designed to be easy to use and integrate into existing projects.</p>
      <p>Github repo: <a class="text-blue-500 hover:underline" href="https://github.com/janzheng/sheetlog">https://github.com/janzheng/sheetlog</a></p>
      <p>Live test sheet: <a class="text-blue-500 hover:underline" href="https://docs.google.com/spreadsheets/d/15XoANPN-DAyBkQlN9-s7bCaWzDNibuWTXHFCQMISVK4/edit?usp=sharing">Google Sheet</a></p>
      <hr>
      <p>It can either be used in Node:</p>
      
      <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
import { Sheetlog } from '@yawnxyz/sheetlog';

const sheet = new Sheetlog({
  sheetUrl: 'YOUR_SHEET_URL',
  sheet: 'Sheet1',
});

await sheet.log({ message: 'Hello world' }); // Basic logging
await sheet.get('123'); // Get by ID
await sheet.put('123', { message: 'Updated' }); // Update by ID 
await sheet.delete('123'); // Delete by ID
      </pre>



<p>Or as POST requests directly to the Apps Script:</p>
      <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
// Simple POST request example
const response = await fetch('YOUR_SHEET_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    method: 'POST',
    sheet: 'Sheet1',
    payload: {
      message: 'Hello from API',
      timestamp: new Date().toISOString()
    }
  })
});</pre>


      <h2 class="text-xl font-semibold mb-4">Setup</h2>
      <ol class="list-decimal ml-6 mb-6 space-y-2">
        <li>Create a new Google Sheet</li>
        <li>Go to Extensions > Apps Script</li>
        <li>Copy the Sheetlog library code into the script editor: <a class="text-blue-500 hover:underline" href="https://github.com/janzheng/sheetlog/blob/main/sheetlog.js">https://github.com/janzheng/sheetlog/blob/main/sheetlog.js</a></li>
        <li>Deploy as web app and copy the URL</li>
        <li>Paste the URL below to start using the demo</li>
      </ol>
      
      <input 
        type="text" 
        x-model="sheetUrl" 
        @input="updateSheetUrl"
        placeholder="Enter your Sheet Web App URL"
        class="w-full p-2 border rounded mb-4"
      >

      <p>As you try the examples below, the commands will be sent to the Apps Script in the above URL, and either read or write to the Google Sheets connected to the app.</p>
      <p>This demo uses the following Google Sheet: <a class="text-blue-500 hover:underline" href="https://docs.google.com/spreadsheets/d/15XoANPN-DAyBkQlN9-s7bCaWzDNibuWTXHFCQMISVK4/edit?usp=sharing">https://docs.google.com/spreadsheets/d/15XoANPN-DAyBkQlN9-s7bCaWzDNibuWTXHFCQMISVK4/edit?usp=sharing</a>
      </p>
    </div>


    <div class="space-y-8">
      <template x-for="example in examples" :key="example.title">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h3 x-text="example.title" class="text-xl font-semibold mb-2"></h3>
          <p x-text="example.description" class="text-gray-600 mb-4"></p>
          
          <div class="bg-gray-100 p-4 rounded-md mb-4">
            <textarea 
              x-model="example.payloadStr"
              @input="updatePayload($event, example)"
              class="w-full font-mono bg-transparent border-none focus:outline-none"
              rows="6"
            ></textarea>
          </div>
          
          <button 
            @click="executeExample(example)"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          >
            Run Example
          </button>

          <div x-show="example.output" class="mt-4">
            <h4 class="font-semibold mb-2">Output:</h4>
            <pre class="bg-gray-100 p-4 rounded-md overflow-x-auto whitespace-pre-wrap"><code x-text="example.output"></code></pre>
          </div>
        </div>
      </template>
    </div>
  </div>

  <script>
    document.addEventListener('alpine:init', () => {
      Alpine.data('sheetlogDemo', () => ({
        sheetUrl: 'https://script.google.com/macros/s/AKfycbz-wz7rvFBz51DLdhof4m5LnG6PfSunW05kjOfHfqh_V5ZFFQxRycd11zQHv53oboEJ/exec',
        examples: [
          {
            title: 'Get Sheet Info',
            description: 'Get all sheet names and their IDs',
            payload: {
              method: "GET_SHEETS"
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Sheet as CSV',
            description: 'Get all data from a sheet tab as structured data',
            payload: {
              method: "GET_CSV",
              sheet: "testSheet"  // User can change this to their sheet name
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Columns',
            description: 'Fetch column data from the sheet',
            payload: {
              method: "GET_COLUMNS",
              sheet: "testSheet",
              startColumn: "A",
              endColumn: "C"
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Rows',
            description: 'Fetch specific rows from the sheet',
            payload: {
              method: "GET_ROWS",
              sheet: "testSheet",
              startRow: 2,
              endRow: 5
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Create New Row',
            description: 'Add a new row of data',
            payload: {
              method: "POST",
              sheet: "testSheet",
              payload: {
                name: "John Doe",
                email: "john@example.com"
              }
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Update or Create Row (Upsert)',
            description: 'Create or update a row based on ID',
            payload: {
              method: "UPSERT",
              sheet: "testSheet",
              idColumn: "email",
              id: "john@example.com",
              payload: {
                name: "John Doe Updated",
                status: "active"
              }
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Dynamic Post',
            description: 'Create row with automatic column creation',
            payload: {
              method: "DYNAMIC_POST",
              sheet: "testSheet",
              payload: {
                newField: "newValue",
                anotherField: "anotherValue"
              }
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Find Records',
            description: 'Search for specific records',
            payload: {
              method: "FIND",
              sheet: "testSheet",
              idColumn: "Name",
              id: "Banana",
              returnAllMatches: true
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Paginated Get',
            description: 'Get paginated results',
            payload: {
              method: "PAGINATED_GET", 
              sheet: "testSheet",
              limit: 5,
              cursor: 2,
              sortBy: "Name",
              sortDir: "desc"
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Range Update',
            description: 'Update multiple cells efficiently',
            payload: {
              method: "RANGE_UPDATE",
              sheet: "testSheet",
              startRow: 22,
              startCol: 5,
              data: [
                ["A1", "B1", "C1"],
                ["A2", "B2", "C2"]
              ]
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Aggregate',
            description: 'Perform calculations on columns',
            payload: {
              method: "AGGREGATE",
              sheet: "testSheet",
              column: "amount",
              operation: "sum"
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Add Column',
            description: 'Add a new column to the sheet',
            payload: {
              method: "ADD_COLUMN",
              sheet: "testSheet",
              columnName: "newColumn"
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Range',
            description: 'Get values from a specific range, optionally stopping at empty cells',
            payload: {
              method: "GET_RANGE",
              sheet: "testSheet",
              startRow: 2,
              startCol: 1,
              stopAtEmpty: false
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Range (Stop at Empty)',
            description: 'Get range values, stopping at the first empty cell in row/column',
            payload: {
              method: "GET_RANGE",
              sheet: "testSheet",
              startRow: 2,
              startCol: 1,
              stopAtEmpty: true
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Range (Stop at Empty Row)',
            description: 'Get range values, stopping when encountering an empty row',
            payload: {
              method: "GET_RANGE",
              sheet: "testSheet",
              startRow: 2,
              startCol: 1,
              stopAtEmptyRow: true
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Range (Stop at Empty Column)',
            description: 'Get range values, stopping when encountering an empty column',
            payload: {
              method: "GET_RANGE",
              sheet: "testSheet",
              startRow: 2,
              startCol: 1,
              stopAtEmptyColumn: true
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Range (Skip Empty)',
            description: 'Get range values, skipping any empty rows and columns',
            payload: {
              method: "GET_RANGE",
              sheet: "testSheet",
              startRow: 2,
              startCol: 1,
              skipEmptyRows: true,
              skipEmptyColumns: true
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Find Data Block',
            description: 'Automatically find and return a block of data within a search range',
            payload: {
              method: "GET_DATA_BLOCK",
              sheet: "testSheet",
              searchRange: {
                startRow: 1,
                startCol: 1,
                endRow: 99,
                endCol: 26  // Column Z
              }
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Columns with Formulas',
            description: 'Fetch column data including formulas and cell contents',
            payload: {
              method: "GET_COLUMNS",
              sheet: "testSheet",
              startColumn: "A",
              endColumn: "C",
              includeFormulas: true
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get Columns with Full Formatting',
            description: 'Fetch column data with formulas and all formatting information',
            payload: {
              method: "GET_COLUMNS",
              sheet: "testSheet",
              startColumn: "A",
              endColumn: "C",
              includeFormulas: true,
              includeFormatting: true
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get All Cells with Full Details',
            description: 'Get all sheet data including formulas, formatting, and styles',
            payload: {
              method: "GET_ALL_CELLS",
              sheet: "testSheet",
              includeFormulas: true,
              includeFormatting: true
            },
            payloadStr: '',
            output: ''
          },
          {
            title: 'Get All Cells (Values Only)',
            description: 'Get all sheet data with just the values',
            payload: {
              method: "GET_ALL_CELLS",
              sheet: "testSheet",
              includeFormulas: false,
              includeFormatting: false
            },
            payloadStr: '',
            output: ''
          }
        ],

        init() {
          this.examples.forEach(ex => {
            ex.payloadStr = JSON.stringify(ex.payload, null, 2);
          });
        },

        updatePayload(event, example) {
          try {
            example.payload = JSON.parse(event.target.value);
            example.payloadStr = event.target.value;
          } catch (err) {
            example.payloadStr = event.target.value;
          }
        },

        async executeExample(example) {
          if (!this.sheetUrl) {
            alert('Please enter a Sheet URL first');
            return;
          }
          
          try {
            let payload;
            try {
              payload = JSON.parse(example.payloadStr);
            } catch (err) {
              throw new Error('Invalid JSON in payload');
            }

            const response = await fetch('/api/sheet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sheetUrl: this.sheetUrl,
                payload: payload
              })
            });
            const result = await response.json();
            example.output = JSON.stringify(result, null, 2);
          } catch (err) {
            example.output = 'Error: ' + err.message;
            console.error('Error:', err);
          }
        }
      }));
    });
  </script>
  <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
  <style>
    p {
      margin-bottom: 0.5rem;
    }
  </style>
</body>
</html>
`;

app.get("/", (c) => c.html(html));

export default (typeof Deno !== "undefined" && Deno.env.get("valtown")) ? app.fetch : app;