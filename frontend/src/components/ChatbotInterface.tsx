import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "@/lib/icons";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AIClient } from "@/lib/ai-client";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotInterfaceProps {
  activeTab: string;
}

export const ChatbotInterface = ({ activeTab }: ChatbotInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiClient, setAiClient] = useState<AIClient | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize AI client
  useEffect(() => {
    try {
      const client = new AIClient();
      setAiClient(client);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant for the pharmacy scheduling system. I can help you with general questions about pharmacy operations, scheduling, and employee management. How can I assist you today?',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to initialize AI client:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize AI client');
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Sorry, I\'m currently unavailable. The AI service configuration needs to be checked. Please contact your administrator.',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    if (!aiClient) {
      toast({
        variant: "destructive",
        title: "AI Unavailable",
        description: initError || "AI client not initialized"
      });
      setIsLoading(false);
      return;
    }

    try {
      const aiResponse = await aiClient.simpleChat(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Failed to get AI response. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (activeTab !== "chatbot") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Assistant
          </h1>
          <p className="text-muted-foreground mt-2">
            Get help with pharmacy scheduling and operations
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90"
          onClick={() => {
            toast({
              title: "AI Assistant Ready",
              description: "Ask me anything about pharmacy operations and scheduling!"
            });
          }}
        >
          <Bot className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat Interface */}
      <Card className="bg-card border-border shadow-card h-[600px]">
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  Pharmacy AI Assistant
                </h3>
                <p className="text-sm text-muted-foreground">
                  Online • Ready to help
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 min-h-0">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? "justify-end" : "justify-start"}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              
              {/* Scroll target */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Ask me about pharmacy scheduling..."
                className="flex-1 min-h-[40px] max-h-32 resize-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};