interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export class AIClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    console.log('Environment variables:', {
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'undefined',
      allEnvVars: Object.keys(import.meta.env)
    });
    
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured. Please check VITE_OPENROUTER_API_KEY environment variable.');
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Pharmacy Scheduling System'
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('AI Client error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async simpleChat(userMessage: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for a pharmacy scheduling system. You can help with general questions about pharmacy operations, scheduling, and employee management. Keep your responses concise and helpful.'
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return this.chat(messages);
  }
}

// Export the class for manual initialization
// export const aiClient = new AIClient();