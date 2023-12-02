
/* 

  payload can be an object or an array of objects of any schema
  - deeper nested JSON will be stringified in a cell, not spread across the csv

*/

// import { Sema } from 'async-sema'
import Sqids from 'sqids'
import dotenv from 'dotenv'


class Sheet {
  constructor() {
    this.sqids = new Sqids();
    this.loud = false
    this.logPayload = true;
    // this.concurrency = 2;
    this.useSqid = true;
    this.contentType = 'application/json';

    // doing all this so we can use this on the browser
    // which is NOT SAFE since the URL is exposed
    // but YOLO
    if (typeof process !== 'undefined') {
      dotenv.config();
      this.SHEET_URL = process.env['SHEET_URL'];
    } else {
      this.contentType = 'application/x-www-form-urlencoded';
      // only form types can be submitted to spreadAPI from the browser
      if (this.loud) {
        console.log('Browser mode: set a custom sheetUrl');
      }
    }
  }

  setup({ sheetUrl, logPayload, concurrency, useSqid }) {
    this.SHEET_URL = this.SHEET_URL || sheetUrl;
    this.logPayload = this.logPayload || logPayload;
    this.concurrency = this.concurrency || concurrency;
    this.useSqid = this.useSqid || useSqid;
  }

  async log(payload, { sheet = 'Logs', sqid = [new Date().getTime()] } = {}) {
    // const semaAdd = new Sema(this.concurrency);
    let data;
    // await semaAdd.acquire();
    try {
      payload['sqid'] = this.useSqid && this.sqids.encode(sqid);

      if (!this.SHEET_URL) {
        throw new Error('SHEET_URL not set');
        return;
      }

      const response = await fetch(this.SHEET_URL, {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json'
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify({
          "method": "DYNAMIC_POST",
          "sheet": sheet,
          payload: payload,
        })
      })

      try {
        data = await response.json()
      } catch (e) { }
      if (this.logPayload) {
        console.log(payload);
      }
    } finally {
      // semaAdd.release();
    }
    return data;
  }
}

export { Sheet };
export default new Sheet();

