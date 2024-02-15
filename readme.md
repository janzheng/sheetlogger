
# Sheet.log

Sheet.log is a simple console.log-like logger — think Sentry — to Google Sheets with a modified [SpreadAPI script](https://spreadapi.roombelt.com/).

This is ideal for projects and prototypes where Sentry is too heavy, and you just want a semi-public log dump. Google Sheets is great because they have filtering, formulas, graphing, and more stuff built in. 

Google Sheets supports up to roughly 200,000 cells per sheet (I think), which makes sheet.log perfect for toy projects and MVPs that need a faux, persisted "database"

Sheet.log is built on top of the excellent [SpreadAPI](https://spreadapi.roombelt.com/) library, which is a Google Apps Script library that turns any Google Sheets into a data store.




## Installation

1. Install package: `yarn add --dev @yawnxyz/sheetlog`
1. Create a Google Sheet for logging
1. Follow the [installation instructions for SpreadAPI](https://spreadapi.roombelt.com)
1. Replace the default script with the custom script (spreadapi-custom.js) in this repo
1. Make sure to change the appropriate authentication for your app!!
1. Deploy the app per installation instructions, and get the custom URL.
1. Set that URL to .env.SHEET_URL to your deployed SpreadAPI Apps Script, or with `sheet.setup({sheetUrl: "some url"})`
1. Create a new Google Sheets tab named "Logs"
1. Now you can log any object to your sheet, with `sheet.log({some: "data"})` to your code, and it'll log to the `Logs` sheet!


## Usage

### Quick Start

To start logging data to your Google Sheet:

```
import sheet from '@yawnxyz/sheetlog';
sheet.log({Name: "First Name"})
```

This appends all data to the `Logs` tab, and requires a column named `Name` to exist.


### Logging Data

#### .log(payload, options)
The .log function is used to log data to the specified sheet. It accepts the following parameters:
- payload: The data to be logged.
- options: An object containing additional options such as sheet, sheetUrl, sqid, method, id, and idColumn.

Example:
```
const payload = { name: 'John', age: 30 };
const options = { sheet: 'Users', method: 'POST' };
sheet.log(payload, options);
```

#### .update(payload, options)
The .update function is used to update existing data in the specified sheet. It accepts the same parameters as .log and sets the method to "UPSERT".

Example:
```
const payload = { id: 123, name: 'Jane', age: 25 };
const options = { sheet: 'Users' };
sheet.update(payload, options);
```

#### .add(payload, options)
The .add function is used to add new data to the specified sheet. It accepts the same parameters as .log, but turns any new keys in the object into columns

Example:
```
const payload = { name: 'Alice', age: 28 };
const options = { sheet: 'Users' };
sheet.add(payload, options);
```

#### .find(idColumn, id, returnAllMatches)
The .find function is used to find data in the specified sheet based on the provided idColumn and id. It accepts the idColumn, id, and returnAllMatches parameters.

This method returns an object, but setting `returnAllMatches=true` will instead return an array of all matches.

Example:
```
const idColumn = 'id';
const id = 123;
const returnAllMatches = true;
sheet.find(idColumn, id, returnAllMatches);
```






### Using Custom Sheets

To use a custom sheet, you can do this:

```
import sheet from '@yawnxyz/sheetlog';
sheet.log({Name: "First Name"}, 
  {
    sheet: "Signups", // custom sheet name
  })
```

This will work as long as you have the appropriate Google Sheets tabs set up — with the correct spelling of the sheet name and column names.



### Custom Sheets

You can also setup the custom sheet, then log data to the new configuation: 

```
sheet.setup({
  sheet: "sheetName", // custom default sheet name
  sheetUrl: "some custom sheet url",
  logPayload: false, // log the payload back to console?
  useSqid: false, // creates a sqid based on timestamp for easy referencing
  method: "POST", // default method is POST, but can use "DYNAMIC_POST" for adding more columns, etc.
})

sheet.log({ Name: "Test Name" });
```

You can also create and set up multiple Sheets:
```
import { Sheet } from '@yawnxyz/sheetlog';

const errorSheet = new Sheet();
errorSheet.setup({
  sheetUrl: "https://googleappscriptlink",
  sheet: "Errors"
})

const signupSheet = new Sheet();
signupSheet.setup({
  sheetUrl: "https://googleappscriptlink",
  sheet: "Signups"
})

errorSheet.log({ Message: error.message });
signupSheet.log({ Name: "New Signup Name" });
```







## Notes

- Originally, [sqids](https://github.com/sqids) was used to create short IDs based on request time to quickly identify/search for batches of data in lengthy, inscrutable logs. It's very useful, but adds another dep, so I decided to make it optional. 

### Additions to SpreadAPI

Many thanks to [SpreadAPI](https://spreadapi.roombelt.com) for sharing the code for free (and even letting everyone know you CAN do this at all, without any expensive third party tools or the official API!). All credit goes to them.

1. Added column management / dynamic column support
1. Adding data to "DYNAMIC_POST" creates columns that otherwise don't exist; this lets us log anything we want (but creates clutter in the sheet)
1. Added date support for every log: the first column is always "Date Modified"
1. Added better JSON handling; if you have a nested JSON it'll display it properly in each cell
1. Find, Upsert, and a few other helpers
