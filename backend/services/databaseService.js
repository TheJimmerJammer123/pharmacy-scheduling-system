const { Pool } = require('pg');
const { logger } = require('../middleware/errorHandler');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'db',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'pharmacy',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.setupPoolEvents();
  }

  setupPoolEvents() {
    this.pool.on('connect', () => {
      logger.info('New client connected to PostgreSQL database');
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', { error: err.message, stack: err.stack });
    });
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Database query failed', {
        error: error.message,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as timestamp, version() as version');
      return {
        status: 'healthy',
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();