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

  // Improved Excel date normalization (handles Excel 1900 leap year bug and string inputs)
  normalizeDate(value) {
    if (!value) return undefined;

    // If already a Date
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }

    const str = String(value).trim();

    // If it's an ISO-like date string or recognizable string
    const asDate = new Date(str);
    if (!isNaN(asDate.getTime())) {
      return asDate.toISOString().slice(0, 10);
    }

    // Excel serial date (1900 date system)
    if (/^\d+$/.test(str)) {
      const serial = parseInt(str, 10);
      if (!isNaN(serial)) {
        // Excel counts from 1 at 1900-01-01 and has a fake 1900-02-29 (leap year bug)
        const excelEpoch = new Date(Date.UTC(1900, 0, 1)); // 1900-01-01
        const date = new Date(excelEpoch.getTime() + (serial - 1) * 86400000);
        // Adjust for the non-existent Feb 29, 1900 for serials > 59
        if (serial > 59) {
          date.setUTCDate(date.getUTCDate() - 1);
        }
        return date.toISOString().slice(0, 10);
      }
    }

    return undefined;
  }

  async upsertScheduleEntry(client, { 
    store_number, date, employee_name, shift_time, notes,
    employee_id, region, role, employee_type, scheduled_hours, 
    start_time, end_time, published 
  }) {
    const query = `
      INSERT INTO schedule_entries (
        store_number, date, employee_name, shift_time, notes,
        employee_id, region, role, employee_type, scheduled_hours,
        start_time, end_time, published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (store_number, date, employee_name, shift_time)
      DO UPDATE SET 
        notes = EXCLUDED.notes,
        employee_id = EXCLUDED.employee_id,
        region = EXCLUDED.region,
        role = EXCLUDED.role,
        employee_type = EXCLUDED.employee_type,
        scheduled_hours = EXCLUDED.scheduled_hours,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        published = EXCLUDED.published,
        updated_at = NOW()
      RETURNING *
    `;
    const params = [
      store_number, date, employee_name, shift_time, notes || null,
      employee_id || null, region || null, role || null, employee_type || null, 
      scheduled_hours || null, start_time || null, end_time || null, 
      published !== undefined ? published : true
    ];
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
    
    console.log('📋 DEBUG: Sheet processing info:');
    console.log('   Total rows:', rows.length);
    console.log('   Headers found:', headerRow.length);
    console.log('   Index map size:', Object.keys(indexMap).length);
    console.log('   Index map keys:', Object.keys(indexMap));

    // Key columns mapping candidates - Updated for Excel shift detail format  
    const employeeKeys = ['employee name', 'employee', 'name']; // Only look for full name columns
    const storeKeys = ['store number', 'store', 'site', 'location number', 'site number', 'scheduled site'];
    const dateKeys = ['date', 'shift date', 'work date', 'scheduled date'];
    const shiftStartKeys = ['shift start', 'start time', 'start'];
    const shiftEndKeys = ['shift end', 'end time', 'end'];
    const notesKeys = ['notes', 'comment', 'remarks'];
    
    // Additional columns for enhanced schema
    const regionKeys = ['region'];
    const roleKeys = ['role', 'position', 'job title'];
    const employeeTypeKeys = ['employee type', 'type', 'employment type'];
    const scheduledHoursKeys = ['scheduled hours', 'hours', 'shift hours'];

    let inserted = 0;
    let updated = 0;
    let deduped = 0; // number of conflicts treated as update
    let skipped = 0;
    const errors = [];

    console.log('🔧 DEBUG: Getting database client...');
    const client = await db.getClient();
    try {
      console.log('🔧 DEBUG: Starting database transaction...');
      await client.query('BEGIN');

      const dataRows = rows.slice(1).slice(0, this.MAX_ROWS);
      console.log(`🔧 DEBUG: About to process ${dataRows.length} data rows`);
      
      for (const row of dataRows) {
        console.log(`🔧 DEBUG: Starting row processing, current skipped=${skipped}, inserted=${inserted}`);
        try {
          // Extract core employee info
          const rawEmployeeName = this.pickValue(row, indexMap, employeeKeys);
          const firstName = this.pickValue(row, indexMap, ['first name']);
          const lastName = this.pickValue(row, indexMap, ['last name']);
          const employee_name = rawEmployeeName || [firstName, lastName].filter(Boolean).join(' ').trim();
          const employee_id = this.pickValue(row, indexMap, ['employee id']);
          
          // DEBUG: Show processing for first few rows
          if (skipped + inserted + updated < 5) {
            console.log(`🔧 DEBUG SERVICE: Processing row ${skipped + inserted + updated + 1}`);
            console.log(`   rawEmployeeName: "${rawEmployeeName || 'undefined'}"`);
            console.log(`   firstName: "${firstName || 'undefined'}"`); 
            console.log(`   lastName: "${lastName || 'undefined'}"`);
            console.log(`   final employee_name: "${employee_name}"`);
          }

          // Extract schedule info
          const storeNumberStr = this.pickValue(row, indexMap, storeKeys);
          const dateStr = this.pickValue(row, indexMap, dateKeys);
          const start = this.pickValue(row, indexMap, shiftStartKeys);
          const end = this.pickValue(row, indexMap, shiftEndKeys);
          const notes = this.pickValue(row, indexMap, notesKeys);

          // Extract enhanced schema fields
          const region = this.pickValue(row, indexMap, regionKeys);
          const role = this.pickValue(row, indexMap, roleKeys);
          const employee_type = this.pickValue(row, indexMap, employeeTypeKeys);
          const scheduled_hours = this.pickValue(row, indexMap, scheduledHoursKeys);

          // Debug logging for first few rows before validation
          if (skipped + inserted + updated < 3) {
            console.log(`🔍 DEBUG Row ${skipped + inserted + updated + 1} - Raw extractions:`, {
              employee_name,
              storeNumberStr,
              dateStr,
              start,
              end,
              hasEmployeeName: !!employee_name,
              hasStoreNumber: !!storeNumberStr,
              hasDate: !!dateStr,
              hasStart: !!start,
              hasEnd: !!end
            });
            console.log('   Index map keys:', Object.keys(indexMap));
          }

          if (!employee_name || !storeNumberStr || !dateStr || (!start && !end)) {
            skipped++;
            continue;
          }

          // Parse store number from format like "79 - Syracuse (Electronics Pkwy)"
          let store_number;
          if (String(storeNumberStr).includes(' - ')) {
            store_number = parseInt(String(storeNumberStr).split(' - ')[0], 10);
          } else {
            store_number = parseInt(String(storeNumberStr).replace(/[^0-9]/g, ''), 10);
          }
          const date = this.normalizeDate(dateStr);
          const shift_time = start && end ? `${start} - ${end}` : (start || end);

          // Debug logging for first few rows
          if (skipped + inserted + updated < 5) {
            console.log(`🔍 DEBUG Row ${skipped + inserted + updated + 1}:`, {
              employee_name,
              storeNumberStr,
              dateStr,
              date,
              start,
              end,
              shift_time,
              store_number,
              hasStoreNumber: !!store_number,
              hasDate: !!date,
              hasShiftTime: !!shift_time
            });
          }

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
          // Prepare enhanced schedule entry data
          const scheduleData = { 
            store_number, 
            date, 
            employee_name, 
            shift_time, 
            notes,
            employee_id,
            region,
            role,
            employee_type,
            scheduled_hours: scheduled_hours ? parseFloat(scheduled_hours) : null,
            start_time: start,
            end_time: end,
            published: true  // Default to published
          };
          
          const entry = await this.upsertScheduleEntry(client, scheduleData);
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
      console.log('🔧 DEBUG: Exception caught in processExcel:', error.message);
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