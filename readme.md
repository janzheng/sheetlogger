
# sheet.log

Sheet log is a simple console.log-like logger — think Sentry — to Google Sheets with a modified [SpreadAPI script](https://spreadapi.roombelt.com/).

This is ideal for projects and prototypes where Sentry is too heavy, and you just want a semi-public log dump. Google Sheets is great because they have filtering, formulas, graphing, and more stuff built in. 

Google Sheets supports up to roughly 200,000 cells per sheet (I think)

## Installation

1. Install package: `yarn add --dev @yawnxyz/sheetlog`
1. Create a Google Sheet for logging
1. Follow the [installation instructions for SpreadAPI](https://spreadapi.roombelt.com)
1. Replace the default script with the custom script (spreadapi-custom.js) in this repo
1. Make sure to change the appropriate authentication for your app!!
1. Deploy the app per installation instructions, and get the custom URL.
1. Set that URL to .env.SHEET_URL to your deployed SpreadAPI Apps Script, or with `sheet.setup({sheetUrl: "some url"})`
1. Now you can log any object to your sheet, with `sheet.log({some: "data"})` to your code, and it'll log to the `Logs` sheet!


## Usage

By default, `sheet.log({some: "data"})` logs to a tab named "Logs". You can add more sheets/tabs to your Google Sheet with passing in `{sheet: "sheetName"}`.
You can also define a sqid based on a custom number sequence, by passing in `{sqid: [1,2,3]}`. Remember that sqids can always be reversed to the original sequence.

```
sheet.log({some: "data}, {
  sheet: "sheetName", // custom sheet name
  sqid: [new Date().getTime(), userId, postId, commentId] // example of adding more items into a sqid for referencing
  })
```

You can also change some of the default settings by doing:
```
let customSheet = sheet.setup({
  SHEET_URL: "some custom sheet url",
  logPayload: false, // log the payload back to console?
  useSqid: false,    // creates a sqid based on timestamp for easy referencing
})
```

Here's two ways to use sheet.log:

```
import sheet, { Sheet } from './index.mjs';

// sheet.setup({ sheetUrl: "123" });
sheet.log({ a: 1, b: 2 });


const customSheet = new Sheet();
customSheet.setup({
  // SHEET_URL: "https://example.com",
  logPayload: false, // log the payload back to console?
  useSqid: false,    // creates a sqid based on timestamp for easy referencing
})

customSheet.log({ custom: true });
```



## What's different from SpreadAPI?

1. Added column management / dynamic column support
1. Adding data to "DYNAMIC_POST" creates columns that otherwise don't exist; this lets us log anything we want (but creates clutter in the sheet)
1. Added date support for every log: the first column is always "Date Modified"
1. Added better JSON handling; if you have a nested JSON it'll display it properly in each cell



## Other Dependencies

- `sqids` is used to create short IDs based on request time to quickly identify/search for batches of data in lengthy, inscrutable logs



## Updates

- Added checks for dotenv and process, so this can be run client-side. It's not safe as the URL is exposed, but move fast / break things / YOLO etc.
- `async-sema` was causing trouble client-side (for demos) and was removed. Recommend manually wrapping `async-sema` around massive logging jobs though.




## Thanks

Many thanks to [SpreadAPI](https://spreadapi.roombelt.com) for sharing the code for free (and even letting everyone know you CAN do this at all, without any expensive third party tools or the official API!). All credit goes to them.

Also many thanks to GPT-4 for helping me add the custom modes to SpreadAPI :P