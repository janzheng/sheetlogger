
# sheet.log

Sheet log is a simple console.log-like logger — think Sentry — to Google Sheets with a modified [SpreadAPI script](https://spreadapi.roombelt.com/).

This is ideal for projects and prototypes where Sentry is too heavy, and you just want a semi-public log dump. Google Sheets is great because they have filtering, formulas, graphing, and more stuff built in. 


## Installation & Usage

1. Create a Google Sheet for logging
1. Follow the [installation instructions for SpreadAPI](https://spreadapi.roombelt.com)
1. Replace the default script with the custom script (spreadapi-custom.js) in this repo
1. Make sure to change the appropriate authentication for your app!!
1. Set your .env.SHEET_URL to your deployed SpreadAPI Apps Script, or with `sheet.setup({sheetUrl: "some url"})`
1. To log any object to your sheet, add `sheet.log({some: "data"})` to your code


## What's different from SpreadAPI

1. Added column management
1. Adding data to "DYNAMIC_POST" creates columns that otherwise don't exist; this lets us log anything we want (but creates clutter in the sheet)
1. Added dates: the first column is always "Date Modified"

## Other Dependencies

- `async-sema` is used to throttle requests to Google Sheets; more than 5 requests at a time makes Sheets sad
- `sqids` is used to create short IDs based on request time to quickly identify/search for batches of data in lengthy, inscrutable logs

## Thanks

Many thanks to [SpreadAPI](https://spreadapi.roombelt.com) for sharing the code for free (and even letting everyone know you CAN do this at all, without any expensive third party tools or the official API!). All credit goes to them.

Also many thanks to GPT-4 for helping me add the custom modes to SpreadAPI :P