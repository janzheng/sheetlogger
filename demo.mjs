import sheet, { Sheet } from './index.mjs';

// sheet.setup({ sheetUrl: "123" });
sheet.log({ a: 1, b: 2 });


const customSheet = new Sheet();
customSheet.setup({
  // SHEET_URL: "https://example.com",
  logPayload: false, // log the payload back to console?
  concurrency: 5,    // async-sema concurrency; can go up to 5
  useSqid: false,    // creates a sqid based on timestamp for easy referencing
})

customSheet.log({ custom: true });