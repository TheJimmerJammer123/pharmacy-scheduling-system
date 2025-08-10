const xlsx = require('xlsx');
const db = require('./databaseService');
const { logger } = require('../middleware/errorHandler');

class ExcelIngestionService {
  constructor() {
    this.MAX_ROWS = 200000; // safety cap
  }

  decodeBase64ToBuffer(base64Content) {
    try {
      return Buffer.from(base64Content, 'base64');
    } catch (error) {
      throw new Error('Invalid base64 content');
    }
  }

  extractHeaderIndexMap(headerRow) {
    const indexMap = {};
    headerRow.forEach((header, idx) => {
      if (!header || typeof header !== 'string') return;
      const key = header.trim().toLowerCase();
      indexMap[key] = idx;
    });
    return indexMap;
  }

  pickValue(row, indexMap, keys) {
    for (const key of keys) {
      if (indexMap[key] !== undefined) {
        const value = row[indexMap[key]];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }
    return undefined;
  }

  normalizeDate(value) {
    if (!value) return undefined;
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    const str = String(value).trim();
    // Try Excel serial date
    if (/^\d+$/.test(str)) {
      try {
        const serial = parseInt(str, 10);
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + serial * 86400000);
        return date.toISOString().slice(0, 10);
      } catch (_) {}
    }
    // Try YYYY-MM-DD or MM/DD/YYYY
    const iso = new Date(str);
    if (!isNaN(iso.getTime())) {
      return iso.toISOString().slice(0, 10);
    }
    return undefined;
  }

  async upsertScheduleEntry(client, { store_number, date, employee_name, shift_time, notes }) {
    const query = `
      INSERT INTO schedule_entries (store_number, date, employee_name, shift_time, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (store_number, date, employee_name, shift_time)
      DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
      RETURNING *
    `;
    const params = [store_number, date, employee_name, shift_time, notes || null];
    const result = await client.query(query, params);
    return result.rows[0];
  }

  async processExcel({ importId, fileName, base64Content }) {
    const startedAt = Date.now();
    const buffer = this.decodeBase64ToBuffer(base64Content);

    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true, cellNF: false, cellText: false });
    const sheets = workbook.SheetNames;

    if (!sheets || sheets.length === 0) {
      throw new Error('No sheets found in Excel file');
    }

    // Prefer known sheet names, else take first
    const preferredSheets = ['shift detail', 'shift details', 'employee shifts by site'];
    const targetSheetName = sheets.find(s => preferredSheets.includes(String(s).toLowerCase())) || sheets[0];
    const worksheet = workbook.Sheets[targetSheetName];

    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rows || rows.length < 2) {
      throw new Error('Sheet has no data');
    }

    const headerRow = rows[0];
    const indexMap = this.extractHeaderIndexMap(headerRow);

    // Key columns mapping candidates
    const employeeKeys = ['employee id', 'employee', 'employee name', 'name', 'last name', 'first name'];
    const storeKeys = ['store number', 'store', 'site', 'location number', 'site number'];
    const dateKeys = ['date', 'shift date', 'work date'];
    const shiftStartKeys = ['shift start', 'start time', 'start'];
    const shiftEndKeys = ['shift end', 'end time', 'end'];
    const notesKeys = ['notes', 'comment', 'remarks'];

    let inserted = 0;
    let updated = 0;
    let deduped = 0; // number of conflicts treated as update
    let skipped = 0;
    const errors = [];

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const dataRows = rows.slice(1).slice(0, this.MAX_ROWS);
      for (const row of dataRows) {
        try {
          const rawEmployeeName = this.pickValue(row, indexMap, employeeKeys);
          const firstName = this.pickValue(row, indexMap, ['first name']);
          const lastName = this.pickValue(row, indexMap, ['last name']);
          const employee_name = rawEmployeeName || [firstName, lastName].filter(Boolean).join(' ').trim();

          const storeNumberStr = this.pickValue(row, indexMap, storeKeys);
          const dateStr = this.pickValue(row, indexMap, dateKeys);
          const start = this.pickValue(row, indexMap, shiftStartKeys);
          const end = this.pickValue(row, indexMap, shiftEndKeys);
          const notes = this.pickValue(row, indexMap, notesKeys);

          if (!employee_name || !storeNumberStr || !dateStr || (!start && !end)) {
            skipped++;
            continue;
          }

          const store_number = parseInt(String(storeNumberStr).replace(/[^0-9]/g, ''), 10);
          const date = this.normalizeDate(dateStr);
          const shift_time = start && end ? `${start} - ${end}` : (start || end);

          if (!store_number || !date || !shift_time) {
            skipped++;
            continue;
          }

          // Enforce store FK existence: skip if store not present
          const storeRes = await client.query('SELECT 1 FROM stores WHERE store_number = $1', [store_number]);
          if (storeRes.rowCount === 0) {
            skipped++;
            continue;
          }

          const before = await client.query('SELECT 1 FROM schedule_entries WHERE store_number=$1 AND date=$2 AND employee_name=$3 AND shift_time=$4', [store_number, date, employee_name, shift_time]);
          const entry = await this.upsertScheduleEntry(client, { store_number, date, employee_name, shift_time, notes });
          if (before.rowCount > 0) {
            deduped++;
            updated++;
          } else {
            inserted++;
          }
        } catch (rowError) {
          errors.push({ message: rowError.message });
          skipped++;
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Excel ingestion failed', { error: error.message, importId, fileName });
      throw error;
    } finally {
      client.release();
    }

    const durationMs = Date.now() - startedAt;

    return {
      success: true,
      import_id: importId,
      sheet: targetSheetName,
      sheets_processed: 1,
      total_records: inserted + updated,
      inserted,
      updated,
      deduped,
      skipped,
      errors_count: errors.length,
      duration_ms: durationMs
    };
  }
}

module.exports = new ExcelIngestionService();