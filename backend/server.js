const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const { validateUUID, validateRequiredFields, validateContact, validateSMS } = require('./middleware/validation');
const { logger, requestLogger, globalErrorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { 
  securityMiddleware, 
  loginLimiter, 
  smsLimiter, 
  apiLimiter, 
  registerLimiter,
  sanitizeRequest,
  securityLogger,
  getCorsOptions,
  validateJWTSecret 
} = require('./middleware/security');
const {
  metricsMiddleware,
  trackDatabaseMetrics,
  trackSMSMetrics,
  trackAuthMetrics,
  getHealthStatus,
  getMetrics,
  monitorPerformance
} = require('./middleware/monitoring');
const {
  performanceMonitoringMiddleware,
  getPerformanceReport,
  startMetricsCleanup
} = require('./middleware/performanceMonitoring');
const authService = require('./services/authService');
const contactService = require('./services/contactService');
const messageService = require('./services/messageService');
const smsService = require('./services/smsService');
const scheduleService = require('./services/scheduleService');
const aiService = require('./services/aiService');
require('dotenv').config();

// Validate security configuration on startup
validateJWTSecret();

const app = express();
const server = http.createServer(app);
const corsOptions = getCorsOptions();
const io = socketIo(server, {
  cors: corsOptions
});

// Authentication and authorization middleware definitions must come before routes that use them
const authenticateUser = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.substring(7);
    const decoded = await authService.verifyToken(token);
    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else {
      logger.error('Authentication error', { error: error.message });
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
});

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin role required'
    });
  }
  next();
};

// Rate limiting is now handled in security middleware

// Database connection is now handled in the service layer

// Security middleware
app.use(securityMiddleware);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeRequest);
app.use(requestLogger);
app.use(securityLogger);
app.use(metricsMiddleware);
app.use(performanceMonitoringMiddleware);
app.use('/api/', apiLimiter);

// Environment variables are now handled in service classes

// (Rate limiting configured above)

// Health check endpoint (modularized route)
const healthRouter = require('./routes/health');
app.use('/api', healthRouter);

// Metrics endpoint
app.get('/api/metrics', authenticateUser, requireAdmin, (req, res) => {
  res.json(getMetrics());
});

// Performance report endpoint
app.get('/api/performance/report', authenticateUser, requireAdmin, (req, res) => {
  res.json(getPerformanceReport());
});

// Modular AI endpoint (isolated from core flows)
app.post('/api/ai/chat', authenticateUser, asyncHandler(async (req, res) => {
  const { message, context, userRole } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  const result = await aiService.chat({ message, userRole: userRole || req.user?.role || 'employee', context: Array.isArray(context) ? context : [] });
  res.json(result);
}));

// (authenticateUser defined above)

// Token generation is now handled in authService

// Authentication endpoints
const authRouter = require('./routes/auth');
app.use('/api', authRouter);

// Send SMS endpoint
app.post('/api/send-sms', authenticateUser, validateSMS, smsLimiter, asyncHandler(async (req, res) => {
  const { to, message, contactId } = req.body;
  
  try {
    const smsData = await smsService.sendSMS(to, message, contactId);
    trackSMSMetrics('send', true);
    
    // Emit realtime update to all clients in the contact room
    if (contactId) {
      io.to(`contact_${contactId}`).emit('sms_sent', smsData);
    }
    
    res.json(smsData);
  } catch (error) {
    trackSMSMetrics('send', false);
    throw error;
  }
}));

// Webhook endpoint for Capcom6 delivery receipts
app.post('/api/webhooks/capcom6', asyncHandler(async (req, res) => {
  const deliveryData = await smsService.processDeliveryUpdate(req.body);
  trackSMSMetrics('delivery', true);
  
  // Emit realtime update to all clients in the contact room
  if (deliveryData.contactId) {
    io.to(`contact_${deliveryData.contactId}`).emit('sms_delivery_update', deliveryData);
  }
  
  res.json({ received: true });
}));

// Get messages for a contact
app.get('/api/messages/:contactId', authenticateUser, validateUUID('contactId'), asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  // Validate limit and offset
  const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  const offsetNum = Math.max(parseInt(offset) || 0, 0);
  
  const messages = await messageService.getMessagesByContact(contactId, {
    limit: limitNum,
    offset: offsetNum
  });
  
  res.json(messages);
}));

// Get all contacts
app.get('/api/contacts', authenticateUser, asyncHandler(async (req, res) => {
  const contacts = await contactService.getAllContacts(req.query);
  res.json(contacts);
}));

// Get stores
app.get('/api/stores', authenticateUser, asyncHandler(async (req, res) => {
  const stores = await scheduleService.getStores();
  res.json(stores);
}));

// Get appointments
app.get('/api/appointments', authenticateUser, asyncHandler(async (req, res) => {
  const appointments = await scheduleService.getAppointments(req.query);
  res.json(appointments);
}));

// Contact CRUD operations
app.post('/api/contacts', authenticateUser, validateRequiredFields(['name', 'phone']), validateContact, asyncHandler(async (req, res) => {
  const contact = await contactService.createContact(req.body);
  res.status(201).json(contact);
}));

app.put('/api/contacts/:id', authenticateUser, validateUUID('id'), validateContact, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const contact = await contactService.updateContact(id, req.body);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  res.json(contact);
}));

app.delete('/api/contacts/:id', authenticateUser, validateUUID('id'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const contact = await contactService.deleteContact(id);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  res.json({ success: true, message: 'Contact deleted successfully' });
}));

// Schedule entry CRUD operations
app.post('/api/schedule-entries', authenticateUser, validateRequiredFields(['store_number', 'date', 'employee_name', 'shift_time']), asyncHandler(async (req, res) => {
  const scheduleEntry = await scheduleService.createScheduleEntry(req.body);
  res.status(201).json(scheduleEntry);
}));

app.get('/api/schedule-entries', authenticateUser, asyncHandler(async (req, res) => {
  const scheduleEntries = await scheduleService.getScheduleEntries(req.query);
  res.json(scheduleEntries);
}));

app.put('/api/schedule-entries/:id', authenticateUser, validateUUID('id'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const scheduleEntry = await scheduleService.updateScheduleEntry(id, req.body);
  
  if (!scheduleEntry) {
    return res.status(404).json({ error: 'Schedule entry not found' });
  }
  
  res.json(scheduleEntry);
}));

app.delete('/api/schedule-entries/:id', authenticateUser, validateUUID('id'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const scheduleEntry = await scheduleService.deleteScheduleEntry(id);
  
  if (!scheduleEntry) {
    return res.status(404).json({ error: 'Schedule entry not found' });
  }
  
  res.json({ success: true, message: 'Schedule entry deleted successfully' });
}));

// Statistics endpoints
app.get('/api/stats/dashboard', authenticateUser, asyncHandler(async (req, res) => {
  const [contactStats, messageStats, scheduleStats] = await Promise.all([
    contactService.getContactStats(),
    messageService.getMessageStats(),
    scheduleService.getScheduleStats()
  ]);
  
  res.json({
    contacts: contactStats,
    messages: messageStats,
    schedule: scheduleStats,
    timestamp: new Date().toISOString()
  });
}));

// (requireAdmin defined above)

app.get('/api/admin/users', authenticateUser, requireAdmin, asyncHandler(async (req, res) => {
  // This would need a user service method
  res.json({ message: 'User management not implemented yet' });
}));

app.post('/api/auth/change-password', authenticateUser, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Current password and new password required'
    });
  }
  
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json(result);
}));

// Message operations
app.delete('/api/messages/:id', authenticateUser, validateUUID('id'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const message = await messageService.deleteMessage(id);
  
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  res.json({ success: true, message: 'Message deleted successfully' });
}));

// Get all messages (for dashboard and export functionality)
app.get('/api/messages', authenticateUser, asyncHandler(async (req, res) => {
  const messages = await messageService.getAllMessages(req.query);
  res.json(messages);
}));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a contact room for realtime updates
  socket.on('join_contact', (contactId) => {
    socket.join(`contact_${contactId}`);
    console.log(`Client ${socket.id} joined contact room: ${contactId}`);
  });

  // Leave a contact room
  socket.on('leave_contact', (contactId) => {
    socket.leave(`contact_${contactId}`);
    console.log(`Client ${socket.id} left contact room: ${contactId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  try {
    const db = require('./services/databaseService');
    await db.close();
  } catch (e) {
    logger.warn('Database pool close failed during shutdown', { error: e.message });
  }
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Error handling middleware (must be last)
app.use('*', notFoundHandler);
app.use(globalErrorHandler);

// Start performance monitoring
monitorPerformance();
startMetricsCleanup();

const PORT = process.env.BACKEND_PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);
  logger.info(`Database: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`);
  logger.info(`SMS Gateway: ${process.env.CAPCOM6_API_URL}`);
  // Fail-fast readiness hints for agents
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.POSTGRES_PASSWORD) missing.push('POSTGRES_PASSWORD');
  if (!process.env.CAPCOM6_API_URL) missing.push('CAPCOM6_API_URL');
  if (missing.length > 0) {
    logger.warn(`Missing env vars: ${missing.join(', ')} (development may still run)`);
  }
  logger.info('Security configuration loaded');
  logger.info('Performance monitoring enabled');
  logger.info('All services initialized successfully');
});
