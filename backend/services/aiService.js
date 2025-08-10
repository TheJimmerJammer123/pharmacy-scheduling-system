const axios = require('axios');
const { logger } = require('../middleware/errorHandler');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.AI_MODEL || 'openai/gpt-4o-mini';
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  isMockMode() {
    return !this.apiKey;
  }

  async chat({ message, userRole = 'manager', context = [] }) {
    if (this.isMockMode()) {
      logger.warn('AIService running in MOCK mode (OPENROUTER_API_KEY not set)');
      return {
        response: `MOCK RESPONSE: ${message?.slice(0, 140)}`,
        model: 'mock',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    try {
      const systemPrompt = `You are an AI assistant for a pharmacy scheduling system. User role: ${userRole}. Be concise and actionable.`;

      const payload = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...context.map((c) => ({ role: c.role || 'user', content: c.content || '' })),
          { role: 'user', content: message }
        ]
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      const { data } = await axios.post(this.baseUrl, payload, { headers, timeout: 20000 });
      const choice = data?.choices?.[0];

      return {
        response: choice?.message?.content ?? '',
        model: data?.model || this.model,
        usage: data?.usage || {}
      };
    } catch (error) {
      logger.error('AI chat error', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error('AI service unavailable');
    }
  }
}

module.exports = new AIService();
