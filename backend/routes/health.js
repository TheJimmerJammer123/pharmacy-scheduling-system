const express = require('express');
const router = express.Router();
const { asyncHandler, logger } = require('../middleware/errorHandler');
const { getHealthStatus } = require('../middleware/monitoring');
const smsService = require('../services/smsService');
const db = require('../services/databaseService');

router.get('/health', asyncHandler(async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    const smsHealth = await smsService.getGatewayStatus();
    const systemHealth = getHealthStatus();

    res.json({
      ...systemHealth,
      database: dbHealth.status,
      sms: smsHealth.status,
      services: ['postgres', 'sms', 'socket']
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}));

module.exports = router;
