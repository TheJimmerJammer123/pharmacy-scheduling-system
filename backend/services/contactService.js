const db = require('./databaseService');
const { logger } = require('../middleware/errorHandler');

class ContactService {
  async getAllContacts(filters = {}) {
    try {
      const { status, priority, search, limit = 100, offset = 0 } = filters;
      
      let query = `
        SELECT c.*, 
               COUNT(m.id) as message_count,
               COUNT(a.id) as appointment_count
        FROM contacts c
        LEFT JOIN messages m ON c.id = m.contact_id
        LEFT JOIN appointments a ON c.id = a.contact_id
      `;
      
      const whereConditions = [];
      const queryParams = [];
      let paramCount = 0;
      
      if (status) {
        paramCount++;
        whereConditions.push(`c.status = $${paramCount}`);
        queryParams.push(status);
      }
      
      if (priority) {
        paramCount++;
        whereConditions.push(`c.priority = $${paramCount}`);
        queryParams.push(priority);
      }
      
      if (search) {
        paramCount++;
        whereConditions.push(`(c.name ILIKE $${paramCount} OR c.phone ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      query += ` GROUP BY c.id ORDER BY c.name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);
      
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching contacts', { error: error.message, filters });
      throw error;
    }
  }

  async getContactById(id) {
    try {
      const query = `
        SELECT c.*, 
               COUNT(m.id) as message_count,
               COUNT(a.id) as appointment_count
        FROM contacts c
        LEFT JOIN messages m ON c.id = m.contact_id
        LEFT JOIN appointments a ON c.id = a.contact_id
        WHERE c.id = $1
        GROUP BY c.id
      `;
      
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching contact by ID', { error: error.message, contactId: id });
      throw error;
    }
  }

  async createContact(contactData) {
    try {
      const { name, phone, email, priority = 'medium', notes, status = 'active' } = contactData;
      
      const query = `
        INSERT INTO contacts (name, phone, email, priority, notes, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await db.query(query, [name, phone, email, priority, notes, status]);
      logger.info('Contact created', { contactId: result.rows[0].id, name });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating contact', { error: error.message, contactData });
      throw error;
    }
  }

  async updateContact(id, contactData) {
    try {
      const { name, phone, email, priority, notes, status } = contactData;
      
      const query = `
        UPDATE contacts 
        SET name = $1, phone = $2, email = $3, priority = $4, notes = $5, status = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;
      
      const result = await db.query(query, [name, phone, email, priority, notes, status, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      logger.info('Contact updated', { contactId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating contact', { error: error.message, contactId: id, contactData });
      throw error;
    }
  }

  async deleteContact(id) {
    try {
      const query = 'DELETE FROM contacts WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      logger.info('Contact deleted', { contactId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting contact', { error: error.message, contactId: id });
      throw error;
    }
  }

  async getContactStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
          COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
          COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority,
          COUNT(*) FILTER (WHERE priority = 'low') as low_priority
        FROM contacts
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching contact stats', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ContactService();