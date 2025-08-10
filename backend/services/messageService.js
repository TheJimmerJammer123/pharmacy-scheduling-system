const db = require('./databaseService');
const { logger } = require('../middleware/errorHandler');

class MessageService {
  async getMessagesByContact(contactId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const query = `
        SELECT m.*, c.name as contact_name, c.phone as contact_phone
        FROM messages m
        JOIN contacts c ON m.contact_id = c.id
        WHERE m.contact_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await db.query(query, [contactId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching messages by contact', { 
        error: error.message, 
        contactId, 
        options 
      });
      throw error;
    }
  }

  async getAllMessages(options = {}) {
    try {
      const { limit = 100, offset = 0, direction, status } = options;
      
      let query = `
        SELECT m.*, c.name as contact_name, c.phone as contact_phone
        FROM messages m
        LEFT JOIN contacts c ON m.contact_id = c.id
      `;
      
      const whereConditions = [];
      const queryParams = [];
      let paramCount = 0;
      
      if (direction) {
        paramCount++;
        whereConditions.push(`m.direction = $${paramCount}`);
        queryParams.push(direction);
      }
      
      if (status) {
        paramCount++;
        whereConditions.push(`m.status = $${paramCount}`);
        queryParams.push(status);
      }
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY m.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);
      
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching all messages', { error: error.message, options });
      throw error;
    }
  }

  async createMessage(messageData) {
    try {
      const { 
        contact_id, 
        content, 
        direction, 
        status = 'pending', 
        capcom6_message_id,
        ai_generated = false,
        requires_acknowledgment = false,
        metadata = {}
      } = messageData;
      
      const query = `
        INSERT INTO messages (
          contact_id, content, direction, status, capcom6_message_id,
          ai_generated, requires_acknowledgment, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const result = await db.query(query, [
        contact_id, content, direction, status, capcom6_message_id,
        ai_generated, requires_acknowledgment, JSON.stringify(metadata)
      ]);
      
      logger.info('Message created', { 
        messageId: result.rows[0].id, 
        contactId: contact_id, 
        direction 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating message', { error: error.message, messageData });
      throw error;
    }
  }

  async updateMessageStatus(id, status, metadata = {}) {
    try {
      const query = `
        UPDATE messages 
        SET status = $1, 
            metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await db.query(query, [status, JSON.stringify(metadata), id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      logger.info('Message status updated', { messageId: id, status });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating message status', { error: error.message, id, status });
      throw error;
    }
  }

  async deleteMessage(id) {
    try {
      const query = 'DELETE FROM messages WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      logger.info('Message deleted', { messageId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting message', { error: error.message, messageId: id });
      throw error;
    }
  }

  async getMessageStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE DATE(created_at) = $1) as today,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'sent') as sent,
          COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE ai_generated = true) as ai_generated,
          COUNT(*) FILTER (WHERE direction = 'inbound') as inbound,
          COUNT(*) FILTER (WHERE direction = 'outbound') as outbound
        FROM messages
      `;
      
      const result = await db.query(query, [today]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching message stats', { error: error.message });
      throw error;
    }
  }

  async findByCapcom6Id(capcom6MessageId) {
    try {
      const query = 'SELECT * FROM messages WHERE capcom6_message_id = $1';
      const result = await db.query(query, [capcom6MessageId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding message by Capcom6 ID', { 
        error: error.message, 
        capcom6MessageId 
      });
      throw error;
    }
  }
}

module.exports = new MessageService();