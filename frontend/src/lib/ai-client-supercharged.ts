interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model_used?: string;
    data_results?: any[];
    suggested_actions?: Array<{
      label: string;
      action: string;
      parameters?: Record<string, any>;
    }>;
    conversation_id?: string;
    query_executed?: string;
    performance_metrics?: {
      response_time_ms: number;
      model_selection_reason: string;
      data_queries_executed: number;
      tokens_used: number;
    };
  };
}

interface ChatRequest {
  message: string;
  user_id?: string;
  conversation_id?: string;
  context?: {
    previous_messages?: Array<{role: string, content: string}>;
    user_type?: 'management' | 'employee';
    current_time?: string;
    user_permissions?: string[];
  };
  stream?: boolean;
  model_preference?: 'auto' | 'gpt-4' | 'claude-3.5-sonnet' | 'qwen3-coder' | 'gpt-3.5-turbo';
}

interface ChatResponse {
  response: string;
  model_used: string;
  data_results?: any[];
  suggested_actions?: Array<{
    label: string;
    action: string;
    parameters?: Record<string, any>;
  }>;
  conversation_id: string;
  query_executed?: string;
  performance_metrics: {
    response_time_ms: number;
    model_selection_reason: string;
    data_queries_executed: number;
    tokens_used: number;
  };
}

interface ModelCapabilities {
  name: string;
  description: string;
  strengths: string[];
  cost_tier: 'low' | 'medium' | 'high';
  max_tokens: number;
  best_for: string[];
}

interface ConversationContext {
  conversation_id: string;
  user_type: 'management' | 'employee';
  user_permissions: string[];
  message_history: ChatMessage[];
  current_topic?: string;
  active_queries?: string[];
}

export class SuperchargedAIClient {
  private apiUrl: string;
  private apiKey?: string;
  private conversationContext: Map<string, ConversationContext> = new Map();
  private responseCache: Map<string, ChatResponse> = new Map();
  private defaultUserId: string;

  // Model capabilities for intelligent selection
  private modelCapabilities: ModelCapabilities[] = [
    {
      name: 'gpt-4-turbo',
      description: 'Advanced reasoning and complex problem solving',
      strengths: ['complex analysis', 'strategic planning', 'multi-step reasoning'],
      cost_tier: 'high',
      max_tokens: 4000,
      best_for: ['business decisions', 'complex scheduling', 'strategic insights']
    },
    {
      name: 'claude-3.5-sonnet',
      description: 'Analytical thinking and structured responses',
      strengths: ['data analysis', 'detailed explanations', 'structured thinking'],
      cost_tier: 'high', 
      max_tokens: 3000,
      best_for: ['reports', 'analytics', 'detailed analysis']
    },
    {
      name: 'qwen3-coder',
      description: 'Technical queries and SQL generation',
      strengths: ['sql generation', 'technical support', 'database queries'],
      cost_tier: 'low',
      max_tokens: 2000,
      best_for: ['database queries', 'technical questions', 'code help']
    },
    {
      name: 'gpt-3.5-turbo',
      description: 'Quick responses and general chat',
      strengths: ['speed', 'general conversation', 'quick answers'],
      cost_tier: 'low',
      max_tokens: 1500,
      best_for: ['quick questions', 'general chat', 'simple tasks']
    }
  ];

  constructor(userId?: string) {
    // Use Tailscale IP for backend communication
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://100.120.219.68:8002';
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.defaultUserId = userId || `user_${Date.now()}`;
    
    console.log('SuperchargedAIClient initialized:', {
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      userId: this.defaultUserId
    });

    // Initialize default conversation context
    this.initializeConversationContext(this.defaultUserId);
  }

  private initializeConversationContext(userId: string) {
    if (!this.conversationContext.has(userId)) {
      this.conversationContext.set(userId, {
        conversation_id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_type: 'management', // Default, can be updated
        user_permissions: ['read_schedules', 'read_employees', 'read_messages', 'read_stores'],
        message_history: [],
        current_topic: undefined,
        active_queries: []
      });
    }
  }

  // Update user context (permissions, type, etc.)
  updateUserContext(userId: string, updates: Partial<ConversationContext>) {
    const context = this.conversationContext.get(userId);
    if (context) {
      Object.assign(context, updates);
    }
  }

  // Get model recommendations for a query
  getModelRecommendations(message: string): ModelCapabilities[] {
    const messageLength = message.length;
    const hasCodeKeywords = /sql|query|database|select|join|where|technical/i.test(message);
    const hasComplexKeywords = /analyze|predict|optimize|recommend|complex|statistical|report/i.test(message);
    const hasSimpleKeywords = /hello|hi|help|what|how|simple|quick/i.test(message);

    let recommendations = [...this.modelCapabilities];

    if (hasComplexKeywords) {
      recommendations = recommendations.sort((a, b) => 
        a.name.includes('gpt-4') || a.name.includes('claude') ? -1 : 1
      );
    } else if (hasCodeKeywords) {
      recommendations = recommendations.sort((a, b) => 
        a.name.includes('qwen') || a.name.includes('coder') ? -1 : 1
      );
    } else if (hasSimpleKeywords || messageLength < 50) {
      recommendations = recommendations.sort((a, b) => 
        a.name.includes('3.5-turbo') ? -1 : 1
      );
    }

    return recommendations;
  }

  // Generate cache key for response caching
  private generateCacheKey(message: string, context: any): string {
    return `${message}_${JSON.stringify(context)}`.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
  }

  // Enhanced chat method with advanced features
  async chat(
    message: string, 
    options: {
      userId?: string;
      model_preference?: string;
      stream?: boolean;
      use_cache?: boolean;
      context_override?: any;
    } = {}
  ): Promise<ChatMessage> {
    const userId = options.userId || this.defaultUserId;
    this.initializeConversationContext(userId);
    
    const context = this.conversationContext.get(userId)!;
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(message, context);
    if (options.use_cache && this.responseCache.has(cacheKey)) {
      const cachedResponse = this.responseCache.get(cacheKey)!;
      console.log('Using cached response for message:', message.substring(0, 50));
      
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: cachedResponse.response,
        timestamp: new Date(),
        metadata: {
          ...cachedResponse,
          performance_metrics: {
            ...cachedResponse.performance_metrics,
            response_time_ms: Date.now() - startTime
          }
        }
      };
    }

    try {
      const chatRequest: ChatRequest = {
        message,
        user_id: userId,
        conversation_id: context.conversation_id,
        context: {
          previous_messages: context.message_history.slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          user_type: context.user_type,
          current_time: new Date().toISOString(),
          user_permissions: context.user_permissions,
          ...options.context_override
        },
        stream: options.stream || false,
        model_preference: options.model_preference as any || 'auto'
      };

      console.log('Making supercharged AI request:', {
        message: message.substring(0, 100),
        model_preference: chatRequest.model_preference,
        user_type: chatRequest.context?.user_type
      });

      const response = await fetch(`${this.apiUrl}/functions/v1/ai-chat-supercharged`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'apikey': this.apiKey!
        },
        body: JSON.stringify(chatRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const chatResponse: ChatResponse = await response.json();

      // Create user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      // Create assistant message with rich metadata
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: chatResponse.response,
        timestamp: new Date(),
        metadata: {
          model_used: chatResponse.model_used,
          data_results: chatResponse.data_results,
          suggested_actions: chatResponse.suggested_actions,
          conversation_id: chatResponse.conversation_id,
          query_executed: chatResponse.query_executed,
          performance_metrics: chatResponse.performance_metrics
        }
      };

      // Update conversation history
      context.message_history.push(userMessage, assistantMessage);
      
      // Keep only last 20 messages to manage memory
      if (context.message_history.length > 20) {
        context.message_history = context.message_history.slice(-20);
      }

      // Update conversation ID if changed
      if (chatResponse.conversation_id !== context.conversation_id) {
        context.conversation_id = chatResponse.conversation_id;
      }

      // Cache successful responses
      if (options.use_cache) {
        this.responseCache.set(cacheKey, chatResponse);
        
        // Limit cache size
        if (this.responseCache.size > 100) {
          const firstKey = this.responseCache.keys().next().value;
          this.responseCache.delete(firstKey);
        }
      }

      console.log('AI response received:', {
        model: chatResponse.model_used,
        response_length: chatResponse.response.length,
        data_queries: chatResponse.performance_metrics.data_queries_executed,
        response_time: chatResponse.performance_metrics.response_time_ms,
        suggested_actions: chatResponse.suggested_actions?.length || 0
      });

      return assistantMessage;

    } catch (error) {
      console.error('SuperchargedAIClient error:', error);
      
      // Return error message
      return {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `I apologize, but I encountered an error while processing your request. Please try again or contact support if the problem persists. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: {
          model_used: 'error',
          performance_metrics: {
            response_time_ms: Date.now() - startTime,
            model_selection_reason: 'Error occurred',
            data_queries_executed: 0,
            tokens_used: 0
          }
        }
      };
    }
  }

  // Execute specific actions suggested by the AI
  async executeAction(
    action: string, 
    parameters: Record<string, any>, 
    userId?: string
  ): Promise<any> {
    const actualUserId = userId || this.defaultUserId;
    console.log(`Executing action: ${action}`, parameters);

    try {
      switch (action) {
        case 'send_sms':
          return await this.executeSMSAction(parameters);
        case 'trigger_workflow':
          return await this.executeWorkflowAction(parameters);
        case 'schedule_update':
          return await this.executeScheduleUpdate(parameters);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Action execution error (${action}):`, error);
      throw error;
    }
  }

  private async executeSMSAction(params: {phone: string, message: string}): Promise<any> {
    const response = await fetch(`${this.apiUrl}/functions/v1/send-sms-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'apikey': this.apiKey!
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) throw new Error(`SMS send failed: ${response.statusText}`);
    return await response.json();
  }

  private async executeWorkflowAction(params: {workflow_id: string, data: any}): Promise<any> {
    const response = await fetch(`http://100.120.219.68:5678/webhook/${params.workflow_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.data)
    });

    if (!response.ok) throw new Error(`Workflow trigger failed: ${response.statusText}`);
    return await response.json();
  }

  private async executeScheduleUpdate(params: {id: string, updates: any}): Promise<any> {
    const response = await fetch(`${this.apiUrl}/rest/v1/store_schedules?id=eq.${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'apikey': this.apiKey!
      },
      body: JSON.stringify(params.updates)
    });

    if (!response.ok) throw new Error(`Schedule update failed: ${response.statusText}`);
    return await response.json();
  }

  // Simple chat method for quick queries
  async simpleChat(message: string, userId?: string): Promise<string> {
    const response = await this.chat(message, { 
      userId,
      model_preference: 'gpt-3.5-turbo',
      use_cache: true
    });
    return response.content;
  }

  // Get conversation history
  getConversationHistory(userId?: string): ChatMessage[] {
    const actualUserId = userId || this.defaultUserId;
    return this.conversationContext.get(actualUserId)?.message_history || [];
  }

  // Clear conversation history
  clearConversation(userId?: string) {
    const actualUserId = userId || this.defaultUserId;
    const context = this.conversationContext.get(actualUserId);
    if (context) {
      context.message_history = [];
      context.conversation_id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Export conversation for analysis or backup
  exportConversation(userId?: string): any {
    const actualUserId = userId || this.defaultUserId;
    const context = this.conversationContext.get(actualUserId);
    return {
      conversation_id: context?.conversation_id,
      user_type: context?.user_type,
      message_count: context?.message_history.length,
      messages: context?.message_history,
      exported_at: new Date().toISOString()
    };
  }

  // Get model capabilities for UI display
  getModelCapabilities(): ModelCapabilities[] {
    return this.modelCapabilities;
  }

  // Clear cache
  clearCache() {
    this.responseCache.clear();
    console.log('Response cache cleared');
  }
}