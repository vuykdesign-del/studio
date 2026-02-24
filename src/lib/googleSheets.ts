import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SHEET_ID = '10Onx4xL_mFK75W4dVa_0WER9mWLmadg1Ld8s9_xIolU';
const CREDENTIALS_PATH = path.join(process.cwd(), 'src', 'credentials.json');

export function getGoogleAuth() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_email, private_key } = credentials;
  return new google.auth.JWT(
    client_email,
    undefined,
    private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

export async function appendContraction(values: any[]) {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [values],
    },
  });
}

export async function getContractions() {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A1:D',
  });
  return res.data.values || [];
}
