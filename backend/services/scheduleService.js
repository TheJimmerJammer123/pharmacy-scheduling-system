const db = require('./databaseService');
const { logger } = require('../middleware/errorHandler');

class ScheduleService {
  async createScheduleEntry(scheduleData) {
    try {
      const { store_number, date, employee_name, shift_time, notes } = scheduleData;
      
      const query = `
        INSERT INTO schedule_entries (store_number, date, employee_name, shift_time, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await db.query(query, [store_number, date, employee_name, shift_time, notes]);
      logger.info('Schedule entry created', { 
        scheduleId: result.rows[0].id, 
        employee: employee_name,
        store: store_number 
      });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating schedule entry', { error: error.message, scheduleData });
      throw error;
    }
  }

  async getScheduleEntries(filters = {}) {
    try {
      const { employee_name, store_number, date_from, date_to, limit = 100, offset = 0 } = filters;
      
      let query = 'SELECT * FROM schedule_entries';
      const whereConditions = [];
      const queryParams = [];
      let paramCount = 0;
      
      if (employee_name) {
        paramCount++;
        whereConditions.push(`employee_name = $${paramCount}`);
        queryParams.push(employee_name);
      }
      
      if (store_number) {
        paramCount++;
        whereConditions.push(`store_number = $${paramCount}`);
        queryParams.push(store_number);
      }
      
      if (date_from) {
        paramCount++;
        whereConditions.push(`date >= $${paramCount}`);
        queryParams.push(date_from);
      }
      
      if (date_to) {
        paramCount++;
        whereConditions.push(`date <= $${paramCount}`);
        queryParams.push(date_to);
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY date DESC, store_number LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);
      
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching schedule entries', { error: error.message, filters });
      throw error;
    }
  }

  async updateScheduleEntry(id, scheduleData) {
    try {
      const { store_number, date, employee_name, shift_time, notes } = scheduleData;
      
      const query = `
        UPDATE schedule_entries 
        SET store_number = $1, date = $2, employee_name = $3, shift_time = $4, notes = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;
      
      const result = await db.query(query, [store_number, date, employee_name, shift_time, notes, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      logger.info('Schedule entry updated', { scheduleId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating schedule entry', { error: error.message, scheduleId: id, scheduleData });
      throw error;
    }
  }

  async deleteScheduleEntry(id) {
    try {
      const query = 'DELETE FROM schedule_entries WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      logger.info('Schedule entry deleted', { scheduleId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting schedule entry', { error: error.message, scheduleId: id });
      throw error;
    }
  }

  async getStores() {
    try {
      const query = `SELECT * FROM stores WHERE is_active = true ORDER BY store_number`;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching stores', { error: error.message });
      throw error;
    }
  }

  async getAppointments(filters = {}) {
    try {
      const { contactId, date, status, limit = 100, offset = 0 } = filters;
      
      let query = `
        SELECT a.*, c.name as contact_name, c.phone as contact_phone
        FROM appointments a
        JOIN contacts c ON a.contact_id = c.id
      `;
      
      const whereConditions = [];
      const queryParams = [];
      let paramCount = 0;
      
      if (contactId) {
        paramCount++;
        whereConditions.push(`a.contact_id = $${paramCount}`);
        queryParams.push(contactId);
      }
      
      if (date) {
        paramCount++;
        whereConditions.push(`a.appointment_date = $${paramCount}`);
        queryParams.push(date);
      }
      
      if (status) {
        paramCount++;
        whereConditions.push(`a.status = $${paramCount}`);
        queryParams.push(status);
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY a.appointment_date, a.appointment_time LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);
      
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching appointments', { error: error.message, filters });
      throw error;
    }
  }

  async getScheduleStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_entries,
          COUNT(DISTINCT employee_name) as total_employees,
          COUNT(DISTINCT store_number) as active_stores,
          COUNT(*) FILTER (WHERE date >= CURRENT_DATE) as future_entries,
          COUNT(*) FILTER (WHERE date = CURRENT_DATE) as today_entries
        FROM schedule_entries
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching schedule stats', { error: error.message });
      throw error;
    }
  }

  async getEmployees() {
    try {
      const query = `
        SELECT DISTINCT 
          employee_name,
          employee_id,
          role,
          employee_type,
          region,
          COUNT(*) as total_shifts
        FROM schedule_entries 
        WHERE employee_name IS NOT NULL AND employee_name != ''
        GROUP BY employee_name, employee_id, role, employee_type, region
        ORDER BY employee_name
      `;
      
      const result = await db.query(query);
      logger.info('Fetched employees', { count: result.rows.length });
      return result.rows;
    } catch (error) {
      logger.error('Error fetching employees', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ScheduleService();