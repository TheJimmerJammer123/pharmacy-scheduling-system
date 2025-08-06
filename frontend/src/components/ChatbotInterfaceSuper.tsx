import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Send, Bot, User, Loader2, Sparkles, Database, Settings, 
  Copy, Download, Trash2, Mic, MicOff, Brain, Zap,
  Clock, CheckCircle, AlertCircle, BarChart3, MessageSquare,
  Play, Pause, RotateCcw
} from "@/lib/icons";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { SuperchargedAIClient } from "@/lib/ai-client-supercharged";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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

interface QuickAction {
  label: string;
  prompt: string;
  icon: any;
  category: 'schedules' | 'employees' | 'messages' | 'analytics';
}

interface ChatbotInterfaceSuperProps {
  activeTab: string;
  userId?: string;
}

export const ChatbotInterfaceSuper = ({ activeTab, userId }: ChatbotInterfaceSuperProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiClient, setAiClient] = useState<SuperchargedAIClient | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [streamingEnabled, setStreamingEnabled] = useState(false);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<any>(null);
  const { toast } = useToast();

  // Quick action templates
  const quickActions: QuickAction[] = [
    {
      label: "Today's Schedule",
      prompt: "Show me today's employee schedules across all stores",
      icon: Clock,
      category: 'schedules'
    },
    {
      label: "Staff Coverage",
      prompt: "Analyze staff coverage for this week and identify any gaps",
      icon: BarChart3,
      category: 'schedules'
    },
    {
      label: "Employee List",
      prompt: "List all active employees with their contact information",
      icon: User,
      category: 'employees'
    },
    {
      label: "Recent Messages",
      prompt: "Show me recent SMS conversations and message patterns",
      icon: MessageSquare,
      category: 'messages'
    },
    {
      label: "Store Analytics",
      prompt: "Generate analytics report for all pharmacy locations",
      icon: BarChart3,
      category: 'analytics'
    },
    {
      label: "Schedule Conflicts",
      prompt: "Find any scheduling conflicts or overlapping shifts",
      icon: AlertCircle,
      category: 'schedules'
    }
  ];

  // Initialize AI client
  useEffect(() => {
    try {
      const client = new SuperchargedAIClient(userId);
      setAiClient(client);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `🤖 **Welcome to your Supercharged AI Assistant!** 

I'm your advanced pharmacy scheduling AI with multi-model intelligence and real-time data access. I can:

✨ **Analyze Schedules** - Complex scheduling analysis and optimization
🧠 **Smart Insights** - Predictive analytics and recommendations  
💬 **SMS Integration** - Send messages and analyze communications
🔄 **Workflow Automation** - Trigger n8n workflows and automations
📊 **Real-time Data** - Execute SQL queries and generate reports
🎯 **Multi-Model AI** - Intelligent model selection for optimal responses

**Quick Tips:**
- Use voice input by clicking the microphone 🎤
- Try the quick action buttons below
- Ask complex questions - I can handle SQL queries and multi-step analysis
- I remember our conversation context for better assistance

How can I help you today?`,
        timestamp: new Date(),
        metadata: {
          model_used: 'system',
          performance_metrics: {
            response_time_ms: 0,
            model_selection_reason: 'Welcome message',
            data_queries_executed: 0,
            tokens_used: 0
          }
        }
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize AI client:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize AI client');
    }
  }, [userId]);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
        setIsListening(false);
        
        toast({
          title: "Speech recognized",
          description: `"${transcript}"`,
          duration: 2000,
        });
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Speech recognition error",
          description: "Please try again or use text input",
          variant: "destructive",
          duration: 3000,
        });
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter messages based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.metadata?.model_used?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.metadata?.query_executed?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [messages, searchQuery]);

  // Handle voice input
  const toggleVoiceInput = useCallback(() => {
    if (!recognition.current) {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your message now",
        duration: 2000,
      });
    }
  }, [isListening, toast]);

  // Send message
  const sendMessage = async () => {
    if (!aiClient || !newMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);

    try {
      const response = await aiClient.chat(currentMessage, {
        userId,
        model_preference: selectedModel === 'auto' ? undefined : selectedModel,
        stream: streamingEnabled,
        use_cache: cacheEnabled
      });

      setMessages(prev => [...prev, response]);

      // Show performance metrics if enabled
      if (showMetrics && response.metadata?.performance_metrics) {
        const metrics = response.metadata.performance_metrics;
        toast({
          title: "Performance Metrics",
          description: `Response: ${metrics.response_time_ms}ms | Model: ${response.metadata.model_used} | Queries: ${metrics.data_queries_executed}`,
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Message failed",
        description: "Please try again or check your connection",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action
  const handleQuickAction = (action: QuickAction) => {
    setNewMessage(action.prompt);
    // Auto-send after short delay
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        sendMessage();
      }
    }, 100);
  };

  // Execute suggested action
  const executeSuggestedAction = async (
    actionName: string, 
    parameters: Record<string, any>
  ) => {
    if (!aiClient) return;

    setIsLoading(true);
    try {
      const result = await aiClient.executeAction(actionName, parameters, userId);
      
      const actionMessage: ChatMessage = {
        id: `action_${Date.now()}`,
        role: 'assistant',
        content: `✅ **Action Executed: ${actionName}**\n\nResult: ${JSON.stringify(result, null, 2)}`,
        timestamp: new Date(),
        metadata: {
          model_used: 'action_executor'
        }
      };

      setMessages(prev => [...prev, actionMessage]);
      
      toast({
        title: "Action executed successfully",
        description: `${actionName} completed`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Action execution failed:', error);
      toast({
        title: "Action failed",
        description: `Failed to execute ${actionName}: ${error}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy message content
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      duration: 2000,
    });
  };

  // Export conversation
  const exportConversation = () => {
    if (!aiClient) return;

    const conversation = aiClient.exportConversation(userId);
    const blob = new Blob([JSON.stringify(conversation, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacy-ai-conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Conversation exported",
      description: "Downloaded as JSON file",
      duration: 3000,
    });
  };

  // Clear conversation
  const clearConversation = () => {
    if (aiClient) {
      aiClient.clearConversation(userId);
    }
    setMessages([]);
    setSearchQuery("");
    
    toast({
      title: "Conversation cleared",
      duration: 2000,
    });
  };

  // Render message with rich formatting
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="flex-shrink-0">
            {isSystem ? (
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
            )}
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : isSystem
              ? 'bg-purple-50 text-purple-900 border border-purple-200'
              : 'bg-gray-50 text-gray-900'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {/* Show data results if available */}
            {message.metadata?.data_results && message.metadata.data_results.length > 0 && (
              <div className="mt-3 p-3 bg-gray-100 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Query Results</span>
                </div>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(message.metadata.data_results[0], null, 2)}
                </pre>
              </div>
            )}

            {/* Show suggested actions */}
            {message.metadata?.suggested_actions && message.metadata.suggested_actions.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  Suggested Actions
                </div>
                {message.metadata.suggested_actions.map((action, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="outline"
                    className="mr-2 mb-1"
                    onClick={() => executeSuggestedAction(action.action, action.parameters || {})}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {/* Message metadata */}
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>{message.timestamp.toLocaleTimeString()}</span>
            {message.metadata?.model_used && message.metadata.model_used !== 'system' && (
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                {message.metadata.model_used}
              </Badge>
            )}
            {message.metadata?.performance_metrics && showMetrics && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {message.metadata.performance_metrics.response_time_ms}ms
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => copyMessage(message.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <User className="h-4 w-4 text-green-600" />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (initError) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Assistant Unavailable</h3>
          <p className="text-gray-600">{initError}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto">
      {/* Header with controls */}
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Assistant Supercharged
              </h2>
              <p className="text-sm text-gray-600">Multi-model pharmacy scheduling intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model selector */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="AI Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Select</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="qwen3-coder">Qwen3 Coder</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>

            {/* Settings dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>AI Assistant Settings</DialogTitle>
                  <DialogDescription>
                    Configure your AI assistant preferences
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Response Streaming</label>
                    <Switch 
                      checked={streamingEnabled} 
                      onCheckedChange={setStreamingEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Response Caching</label>
                    <Switch 
                      checked={cacheEnabled} 
                      onCheckedChange={setCacheEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show Performance Metrics</label>
                    <Switch 
                      checked={showMetrics} 
                      onCheckedChange={setShowMetrics}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Action buttons */}
            <Button size="sm" variant="outline" onClick={exportConversation}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={clearConversation}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Quick actions */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Quick Actions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
            >
              <action.icon className="h-3 w-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1">
            {filteredMessages.map(renderMessage)}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input area */}
        <div className="border-t bg-white p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Ask me anything about schedules, employees, analytics, or pharmacy operations..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="min-h-[44px] max-h-32 resize-none"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={toggleVoiceInput}
              size="sm"
              variant={isListening ? "default" : "outline"}
              className={isListening ? "bg-red-600 hover:bg-red-700" : ""}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {selectedModel !== 'auto' && (
                <Badge variant="outline" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  {selectedModel}
                </Badge>
              )}
              {cacheEnabled && <Badge variant="outline">Cache On</Badge>}
              {streamingEnabled && <Badge variant="outline">Streaming</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <span>{filteredMessages.length} messages</span>
              {searchQuery && <span>• {filteredMessages.length} filtered</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};