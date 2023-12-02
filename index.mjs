
/* 

  payload can be an object or an array of objects of any schema
  - deeper nested JSON will be stringified in a cell, not spread across the csv

*/

import { Sema } from 'async-sema'
import Sqids from 'sqids'
import dotenv from 'dotenv'

dotenv.config();

class Sheet {
  constructor() {
    this.sqids = new Sqids();
    this.SHEET_URL = process.env['SHEET_URL'];
    this.logPayload = true;
    this.concurrency = 2;
    this.useSqid = true;
  }

  setup({ sheetUrl, logPayload, concurrency, useSqid }) {
    this.SHEET_URL = this.SHEET_URL || sheetUrl;
    this.logPayload = this.logPayload || logPayload;
    this.concurrency = this.concurrency || concurrency;
    this.useSqid = this.useSqid || useSqid;
  }

  async log(payload, { sheet = 'Logs', sqid = [new Date().getTime()] } = {}) {
    const semaAdd = new Sema(this.concurrency);
    let data;
    await semaAdd.acquire();
    try {
      payload['sqid'] = this.useSqid && this.sqids.encode(sqid);

      const response = await fetch(this.SHEET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "method": "DYNAMIC_POST",
          "sheet": sheet,
          payload: payload,
        })
      })

      try {
        data = await response.json()
      } catch(e) {}
      if (this.logPayload) {
        console.log(payload);
      }
    } finally {
      semaAdd.release();
    }
    return data;
  }
}

export { Sheet };
export default new Sheet();

