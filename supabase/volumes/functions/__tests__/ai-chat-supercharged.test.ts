import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Mock environment variables
const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  OPENROUTER_API_KEY: 'test-openrouter-key',
  API_EXTERNAL_URL: 'http://test-api.com'
};

// Mock fetch for AI model calls
global.fetch = jest.fn();

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ data: null, error: null }),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null })
};

jest.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('AI Chat Supercharged Function', () => {
  let handler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    Object.defineProperty(global, 'Deno', {
      value: {
        env: {
          get: (key: string) => mockEnv[key as keyof typeof mockEnv]
        }
      }
    });

    // Mock successful AI response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Test AI response'
          }
        }]
      })
    });

    // Import the handler
    handler = require('./index.ts').default;
  });

  describe('Request Handling', () => {
    it('should handle CORS preflight requests', async () => {
      const request = new Request('http://test.com', {
        method: 'OPTIONS'
      });

      const response = await handler(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should process valid chat requests', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Hello',
          user_id: 'test-user',
          model_preference: 'auto'
        })
      });

      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('Test AI response');
      expect(data.model_used).toBeDefined();
      expect(data.conversation_id).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const response = await handler(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('Model Selection', () => {
    it('should select GPT-4 for complex analytical queries', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Analyze the staffing patterns and predict optimal coverage for next week',
          user_id: 'test-user'
        })
      });

      await handler(request);

      // Should call AI model with GPT-4
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: JSON.stringify(
            expect.objectContaining({
              model: expect.stringContaining('gpt-4')
            })
          )
        })
      );
    });

    it('should select Qwen3 Coder for SQL/technical queries', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Generate SQL query to find employees working on Monday',
          user_id: 'test-user'
        })
      });

      await handler(request);

      // Should call AI model with Qwen3
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: JSON.stringify(
            expect.objectContaining({
              model: expect.stringContaining('qwen')
            })
          )
        })
      );
    });

    it('should respect explicit model preference', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Hello',
          user_id: 'test-user',
          model_preference: 'gpt-3.5-turbo'
        })
      });

      await handler(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: JSON.stringify(
            expect.objectContaining({
              model: expect.stringContaining('gpt-3.5-turbo')
            })
          )
        })
      );
    });
  });

  describe('SQL Query Generation and Execution', () => {
    beforeEach(() => {
      // Mock SQL generation response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'SELECT * FROM store_schedules WHERE date = CURRENT_DATE'
              }
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Formatted response with data'
              }
            }]
          })
        });

      // Mock database query results
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { employee_name: 'John Doe', role: 'Pharmacist', shift_time: '9:00am - 5:00pm' }
        ],
        error: null
      });
    });

    it('should generate and execute SQL queries for data requests', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Show me today\'s schedule',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query_executed).toBeDefined();
      expect(data.data_results).toBeDefined();
      expect(data.performance_metrics.data_queries_executed).toBe(1);
    });

    it('should handle SQL generation errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('AI model error')
      });

      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Show me today\'s schedule',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      
      expect(response.status).toBe(200);
      // Should fall back to normal AI processing
    });

    it('should handle database query errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Show me today\'s schedule',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      
      expect(response.status).toBe(200);
      // Should fall back to normal AI processing
    });
  });

  describe('Response Formatting', () => {
    it('should format analytical responses correctly', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Analyze Monday staffing',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      const data = await response.json();

      expect(data.response).toBeDefined();
      expect(data.performance_metrics).toBeDefined();
      expect(data.performance_metrics.response_time_ms).toBeGreaterThan(0);
    });

    it('should include suggested actions when appropriate', async () => {
      // Mock AI response with suggested actions
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'SUGGEST_ACTION: send_sms {"phone": "123-456-7890", "message": "Test"}'
            }
          }]
        })
      });

      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Send a message to John',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      const data = await response.json();

      expect(data.suggested_actions).toBeDefined();
      expect(data.suggested_actions.length).toBeGreaterThan(0);
    });
  });

  describe('Conversation Storage', () => {
    it('should store user and AI messages in database', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Hello',
          user_id: 'test-user'
        })
      });

      await handler(request);

      // Should call insert twice (user message + AI response)
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2);
    });

    it('should handle conversation storage errors gracefully', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' }
      });

      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Hello',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      
      expect(response.status).toBe(200);
      // Should still return AI response even if storage fails
    });
  });

  describe('Error Handling', () => {
    it('should handle AI model failures with fallback', async () => {
      // Mock primary model failure
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValue('Model unavailable')
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Fallback response'
              }
            }]
          })
        });

      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Hello',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toContain('Fallback Model Used');
    });

    it('should handle complete AI failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('All models unavailable')
      });

      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Hello',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      
      expect(response.status).toBe(500);
    });

    it('should handle malformed requests', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      });

      const response = await handler(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('Performance Metrics', () => {
    it('should include performance metrics in response', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Hello',
          user_id: 'test-user'
        })
      });

      const response = await handler(request);
      const data = await response.json();

      expect(data.performance_metrics).toBeDefined();
      expect(data.performance_metrics.response_time_ms).toBeGreaterThan(0);
      expect(data.performance_metrics.model_selection_reason).toBeDefined();
      expect(data.performance_metrics.data_queries_executed).toBeDefined();
      expect(data.performance_metrics.tokens_used).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should validate user permissions', async () => {
      const request = new Request('http://test.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Show me employee data',
          user_id: 'test-user',
          context: {
            user_type: 'employee',
            user_permissions: ['read_schedules']
          }
        })
      });

      const response = await handler(request);
      
      expect(response.status).toBe(200);
      // Should respect user permissions in SQL generation
    });
  });
});