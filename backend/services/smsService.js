const axios = require('axios');
const { logger } = require('../middleware/errorHandler');
const messageService = require('./messageService');

class SMSService {
  constructor() {
    this.apiUrl = process.env.CAPCOM6_API_URL;
    this.apiKey = process.env.CAPCOM6_API_KEY;
    this.accountId = process.env.CAPCOM6_ACCOUNT_ID;
    this.phoneNumber = process.env.CAPCOM6_PHONE_NUMBER;
    this.username = process.env.CAPCOM6_USERNAME;
    this.password = process.env.CAPCOM6_PASSWORD;
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else if (this.username && this.password) {
      const basic = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${basic}`;
    }
    
    return headers;
  }

  normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return phone;
    }

    const cleanPhone = phone.trim();
    
    // If already in E.164 format, return as is
    if (/^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
      return cleanPhone;
    }
    
    // If US domestic format (10 digits), add +1 prefix
    if (/^[1-9]\d{9}$/.test(cleanPhone)) {
      return `+1${cleanPhone}`;
    }
    
    // Return as is if we can't normalize (validation should catch invalid formats)
    return cleanPhone;
  }

  async sendSMS(to, message, contactId = null) {
    try {
      if (!this.apiUrl) {
        throw new Error('SMS gateway not configured - missing CAPCOM6_API_URL');
      }

      // Normalize phone number for SMS gateway
      const normalizedTo = this.normalizePhoneNumber(to);

      // Capcom6 Android SMS Gateway payload
      const smsPayload = {
        textMessage: { text: message },
        phoneNumbers: [normalizedTo]
      };

      const headers = this.getAuthHeaders();
      const capcomUrl = `${this.apiUrl.replace(/\/$/, '')}/message`;

      logger.info('Sending SMS via Capcom6', {
        originalTo: to,
        normalizedTo,
        messageLength: message.length,
        contactId,
        hasBasic: !!(this.username && this.password),
        hasBearer: !!this.apiKey
      });

      const response = await axios.post(capcomUrl, smsPayload, { 
        headers,
        timeout: 10000 // 10 second timeout
      });

      const smsData = {
        id: (response.data && (response.data.id || response.data.messageId)) || Date.now().toString(),
        to: normalizedTo, // Use normalized number in response
        originalTo: to, // Keep original for reference
        from: this.phoneNumber || 'capcom6-device',
        message: message,
        status: 'sent',
        timestamp: new Date().toISOString(),
        contactId: contactId,
        capcom6_response: response.data
      };

      // Store message in database if contactId is provided
      if (contactId) {
        try {
          const dbMessage = await messageService.createMessage({
            contact_id: contactId,
            content: message,
            direction: 'outbound',
            status: 'sent',
            capcom6_message_id: smsData.id,
            metadata: { capcom6_response: response.data }
          });
          smsData.dbId = dbMessage.id;
        } catch (dbError) {
          logger.error('Failed to store SMS in database', {
            error: dbError.message,
            smsId: smsData.id,
            contactId
          });
          // Don't fail the SMS send if database storage fails
        }
      }

      logger.info('SMS sent successfully', {
        smsId: smsData.id,
        to,
        contactId,
        dbId: smsData.dbId
      });

      return smsData;
    } catch (error) {
      logger.error('Failed to send SMS', {
        error: error.message,
        to,
        contactId,
        response: error.response?.data,
        status: error.response?.status
      });

      // Create failed message record if contactId provided
      if (contactId) {
        try {
          await messageService.createMessage({
            contact_id: contactId,
            content: message,
            direction: 'outbound',
            status: 'failed',
            metadata: { 
              error: error.message,
              failed_at: new Date().toISOString()
            }
          });
        } catch (dbError) {
          logger.error('Failed to store failed SMS in database', {
            error: dbError.message,
            contactId
          });
        }
      }

      throw error;
    }
  }

  async processDeliveryUpdate(webhookData) {
    try {
      const { message_id, status, to, timestamp, contact_id } = webhookData;

      const deliveryData = {
        messageId: message_id,
        status: status,
        to: to,
        timestamp: timestamp || new Date().toISOString(),
        contactId: contact_id
      };

      // Update message status in database if we have the message_id
      if (message_id) {
        const message = await messageService.findByCapcom6Id(message_id);
        if (message) {
          await messageService.updateMessageStatus(
            message.id,
            status,
            {
              delivery_update: deliveryData,
              updated_at: new Date().toISOString()
            }
          );

          logger.info('Message delivery status updated', {
            messageId: message.id,
            capcom6Id: message_id,
            status,
            to
          });
        } else {
          logger.warn('Received delivery update for unknown message', {
            capcom6Id: message_id,
            status,
            to
          });
        }
      }

      return deliveryData;
    } catch (error) {
      logger.error('Failed to process delivery update', {
        error: error.message,
        webhookData
      });
      throw error;
    }
  }

  async getGatewayStatus() {
    try {
      if (!this.apiUrl) {
        return { status: 'not_configured', message: 'SMS gateway not configured' };
      }

      const headers = this.getAuthHeaders();
      const statusUrl = `${this.apiUrl.replace(/\/$/, '')}/status`;

      const response = await axios.get(statusUrl, {
        headers,
        timeout: 5000
      });

      return {
        status: 'connected',
        gateway: 'capcom6',
        data: response.data
      };
    } catch (error) {
      logger.warn('SMS gateway status check failed', {
        error: error.message,
        status: error.response?.status
      });

      return {
        status: 'disconnected',
        error: error.message
      };
    }
  }
}

module.exports = new SMSService();