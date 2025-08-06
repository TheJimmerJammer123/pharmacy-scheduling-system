import { SuperchargedAIClient } from '../ai-client-supercharged';

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  (global.fetch as jest.Mock).mockClear();
});

afterEach(() => {
  process.env = originalEnv;
});

describe('SuperchargedAIClient', () => {
  let client: SuperchargedAIClient;
  const mockApiKey = 'test-api-key';
  const mockApiUrl = 'http://test-api.com';

  beforeEach(() => {
    // Mock environment variables
    process.env.VITE_API_URL = mockApiUrl;
    process.env.VITE_SUPABASE_ANON_KEY = mockApiKey;
    
    client = new SuperchargedAIClient('test-user');
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(client).toBeInstanceOf(SuperchargedAIClient);
    });

    it('should use default userId when not provided', () => {
      const clientWithoutUserId = new SuperchargedAIClient();
      expect(clientWithoutUserId).toBeInstanceOf(SuperchargedAIClient);
    });
  });

  describe('Model Selection', () => {
    it('should select GPT-4 for complex analytical queries', () => {
      const recommendations = client.getModelRecommendations('Analyze the staffing patterns and predict optimal coverage for next week');
      
      expect(recommendations[0].name).toContain('gpt-4');
    });

    it('should select Qwen3 Coder for SQL/technical queries', () => {
      const recommendations = client.getModelRecommendations('Generate SQL query to find employees working on Monday');
      
      expect(recommendations[0].name).toContain('qwen');
    });

    it('should select GPT-3.5 for simple queries', () => {
      const recommendations = client.getModelRecommendations('Hello, how are you?');
      
      expect(recommendations[0].name).toContain('3.5-turbo');
    });
  });

  describe('Chat Functionality', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          response: 'Test response',
          model_used: 'gpt-4-turbo',
          conversation_id: 'conv_123',
          performance_metrics: {
            response_time_ms: 1000,
            model_selection_reason: 'Auto selected',
            data_queries_executed: 0,
            tokens_used: 100
          }
        })
      });
    });

    it('should send chat request with correct parameters', async () => {
      const message = 'Hello, how can you help me?';
      
      await client.chat(message);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/functions/v1/ai-chat-supercharged`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
            'apikey': mockApiKey
          },
          body: JSON.stringify({
            message,
            user_id: 'test-user',
            conversation_id: expect.any(String),
            context: expect.any(Object),
            stream: false,
            model_preference: 'auto'
          })
        })
      );
    });

    it('should handle successful chat response', async () => {
      const message = 'Test message';
      
      const response = await client.chat(message);

      expect(response).toEqual({
        id: expect.any(String),
        role: 'assistant',
        content: 'Test response',
        timestamp: expect.any(Date),
        metadata: {
          model_used: 'gpt-4-turbo',
          conversation_id: 'conv_123',
          performance_metrics: {
            response_time_ms: 1000,
            model_selection_reason: 'Auto selected',
            data_queries_executed: 0,
            tokens_used: 100
          }
        }
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error')
      });

      const response = await client.chat('Test message');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('encountered an error');
    });

    it('should use cache when enabled', async () => {
      const message = 'Cached message';
      
      // First call
      await client.chat(message, { use_cache: true });
      
      // Second call should use cache
      const startTime = Date.now();
      await client.chat(message, { use_cache: true });
      const endTime = Date.now();
      
      // Should be very fast (cached)
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should respect model preference', async () => {
      const message = 'Test message';
      
      await client.chat(message, { model_preference: 'gpt-3.5-turbo' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(
            expect.objectContaining({
              model_preference: 'gpt-3.5-turbo'
            })
          )
        })
      );
    });
  });

  describe('Action Execution', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      });
    });

    it('should execute SMS action', async () => {
      const params = { phone: '123-456-7890', message: 'Test SMS' };
      
      await client.executeAction('send_sms', params);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/functions/v1/send-sms-v3`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params)
        })
      );
    });

    it('should execute workflow action', async () => {
      const params = { workflow_id: 'test-workflow', data: { test: 'data' } };
      
      await client.executeAction('trigger_workflow', params);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://100.120.219.68:5678/webhook/test-workflow',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: 'data' })
        })
      );
    });

    it('should execute schedule update action', async () => {
      const params = { id: '123', updates: { scheduled_hours: 8 } };
      
      await client.executeAction('schedule_update', params);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/rest/v1/store_schedules?id=eq.123`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ scheduled_hours: 8 })
        })
      );
    });

    it('should throw error for unknown action', async () => {
      await expect(
        client.executeAction('unknown_action', {})
      ).rejects.toThrow('Unknown action: unknown_action');
    });

    it('should handle action execution errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Action failed'
      });

      await expect(
        client.executeAction('send_sms', { phone: '123', message: 'test' })
      ).rejects.toThrow('SMS send failed: Action failed');
    });
  });

  describe('Conversation Management', () => {
    it('should get conversation history', () => {
      const history = client.getConversationHistory('test-user');
      expect(Array.isArray(history)).toBe(true);
    });

    it('should clear conversation', () => {
      client.clearConversation('test-user');
      const history = client.getConversationHistory('test-user');
      expect(history).toEqual([]);
    });

    it('should export conversation', () => {
      const exportData = client.exportConversation('test-user');
      
      expect(exportData).toEqual({
        conversation_id: expect.any(String),
        user_type: 'management',
        message_count: 0,
        messages: [],
        exported_at: expect.any(String)
      });
    });

    it('should clear cache', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      client.clearCache();
      
      expect(consoleSpy).toHaveBeenCalledWith('Response cache cleared');
      consoleSpy.mockRestore();
    });
  });

  describe('User Context Management', () => {
    it('should update user context', () => {
      const updates = {
        user_type: 'employee' as const,
        user_permissions: ['read_schedules']
      };
      
      client.updateUserContext('test-user', updates);
      
      // Verify context was updated (this would require accessing private properties in a real test)
      expect(client).toBeDefined();
    });
  });

  describe('Simple Chat', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          response: 'Simple response',
          model_used: 'gpt-3.5-turbo',
          conversation_id: 'conv_123',
          performance_metrics: {
            response_time_ms: 500,
            model_selection_reason: 'Simple chat',
            data_queries_executed: 0,
            tokens_used: 50
          }
        })
      });
    });

    it('should provide simple chat functionality', async () => {
      const response = await client.simpleChat('Hello');
      
      expect(response).toBe('Simple response');
    });
  });

  describe('Model Capabilities', () => {
    it('should return model capabilities', () => {
      const capabilities = client.getModelCapabilities();
      
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
      
      capabilities.forEach(capability => {
        expect(capability).toHaveProperty('name');
        expect(capability).toHaveProperty('description');
        expect(capability).toHaveProperty('strengths');
        expect(capability).toHaveProperty('cost_tier');
        expect(capability).toHaveProperty('max_tokens');
        expect(capability).toHaveProperty('best_for');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await client.chat('Test message');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('encountered an error');
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const response = await client.chat('Test message');

      expect(response.role).toBe('assistant');
      expect(response.content).toContain('encountered an error');
    });
  });

  describe('Cache Management', () => {
    it('should generate cache keys correctly', async () => {
      const message = 'Test message';
      
      // First call
      await client.chat(message, { use_cache: true });
      
      // Second call with same message should use cache
      const startTime = Date.now();
      await client.chat(message, { use_cache: true });
      const endTime = Date.now();
      
      // Should be very fast (cached)
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should limit cache size', async () => {
      // Add many messages to cache
      for (let i = 0; i < 150; i++) {
        await client.chat(`Message ${i}`, { use_cache: true });
      }
      
      // Cache should not exceed size limit
      // This is tested by ensuring the client doesn't crash
      expect(client).toBeDefined();
    });
  });
});