import sheet, { Sheet } from './index.mjs';

// sheet.setup({ sheetUrl: "123" });
sheet.log({ message: "Hello Jessica!!" });


const customSheet = new Sheet();
customSheet.setup({
  // sheetUrl: "https://example.com",
  logPayload: false, // log the payload back to console?
  concurrency: 5,    // async-sema concurrency; can go up to 5
  useSqid: false,    // creates a sqid based on timestamp for easy referencing
})

customSheet.log({ custom: true });