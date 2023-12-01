
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
  }

  setup({ sheetUrl }) {
    this.SHEET_URL = sheetUrl;
  }

  async log(payload, { sheet = 'Logs', concurrency = 2, useSqid = true } = {}) {
    const semaAdd = new Sema(concurrency);
    let data;
    await semaAdd.acquire();
    try {
      payload['sqid'] = useSqid && this.sqids.encode([new Date().getTime()]);

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

export default new Sheet();

