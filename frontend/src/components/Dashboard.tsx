import { useState, useEffect, useMemo, memo } from "react";
import { MessageSquare, Users, Send, TrendingUp, Sparkles, FileText, Edit3, Save, Loader2, Calendar } from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ApiClient, Contact, Message } from "@/lib/supabase-api";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshTrigger?: number;
}

interface DashboardStats {
  contacts: {
    total: number;
    active: number;
    high_priority: number;
  };
  messages: {
    total: number;
    today: number;
    pending: number;
    ai_generated: number;
  };
  appointments: {
    total: number;
    today: number;
    pending: number;
    confirmed: number;
  };
}

interface DailySummary {
  id: number;
  date: string;
  summary: string;
  key_points: string[];
  action_items: string[];
  contacts: string[];
  markdown_content: string;
  created_at: string;
  updated_at: string;
}

export const Dashboard = memo(({ activeTab, setActiveTab, refreshTrigger }: DashboardProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Daily summary state
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState("");

  const { toast } = useToast();

  // Fetch real data including dashboard stats
    const fetchData = async () => {
      try {
        setIsLoading(true);
      const [contactsResponse, messagesResponse, statsResponse] = await Promise.all([
          ApiClient.getContacts(),
        ApiClient.getMessages(),
        ApiClient.getDashboardStats()
        ]);

        if (contactsResponse.success && messagesResponse.success) {
          setContacts(contactsResponse.data || []);
          setMessages(messagesResponse.data || []);
        }

      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
      }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

  // Debounced effect to prevent excessive API calls from refreshTrigger
  useEffect(() => {
    if (activeTab === "dashboard") {
      console.log('[Dashboard] useEffect triggered - activeTab:', activeTab, 'refreshTrigger:', refreshTrigger);
      
      // Debounce the fetchData call to prevent rapid successive API calls
      const timeoutId = setTimeout(() => {
        fetchData();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, refreshTrigger]);

  // Fetch daily summary when dashboard becomes active or when refreshTrigger changes
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDailySummary();
    }
  }, [activeTab, refreshTrigger]);

  // Fetch daily summary
  const fetchDailySummary = async () => {
    console.log('[Dashboard] fetchDailySummary: Starting...');
    try {
      const response = await ApiClient.getDailySummary();
      console.log('[Dashboard] fetchDailySummary: Response', response);
      if (response.success && response.data) {
        console.log('[Dashboard] Setting daily summary:', response.data);
        setDailySummary(response.data);
        setEditedMarkdown(response.data.markdown_content || "");
        // Make it available globally for debugging
        (window as any).dailySummaryData = response.data;
        console.log('[Dashboard] fetchDailySummary: State updated successfully');
      } else {
        console.log('[Dashboard] fetchDailySummary: No data or failed response');
      }
    } catch (error) {
      console.error('Failed to fetch daily summary:', error);
    }
  };

  // Generate daily summary
  const handleGenerateDailySummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await ApiClient.generateDailySummary();
      if (response.success && response.data) {
        setDailySummary(response.data);
        setEditedMarkdown(response.data.markdownContent || "");
        toast({
          title: "Daily Summary Generated",
          description: "AI has analyzed today's conversations and created a summary",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: response.error || "Failed to generate daily summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to generate daily summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate daily summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Save edited daily summary
  const handleSaveDailySummary = async () => {
    if (!dailySummary) return;
    
    setIsSavingSummary(true);
    try {
      // Extract just the date part (YYYY-MM-DD) from the full timestamp
      const dateOnly = dailySummary.date.split('T')[0];
      const response = await ApiClient.updateDailySummary(dateOnly, editedMarkdown);
      if (response.success) {
        setDailySummary(prev => prev ? { ...prev, markdown_content: editedMarkdown } : null);
        setIsEditingSummary(false);
        toast({
          title: "Summary Saved",
          description: "Daily summary has been updated successfully",
        });
      } else {
        toast({
          title: "Save Failed",
          description: response.error || "Failed to save daily summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save daily summary:', error);
      toast({
        title: "Error",
        description: "Failed to save daily summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSummary(false);
    }
  };

  // Calculate real statistics using both API data and local calculations with memoization
  const stats = useMemo(() => {
    const totalContacts = contacts.length;
    
    // Use backend stats for today's messages if available, otherwise calculate locally
    const messagesToday = dashboardStats?.messages.today || messages.filter(msg => {
      const today = new Date();
      const msgDate = new Date(msg.created_at || new Date());
      return msgDate.toDateString() === today.toDateString();
    }).length;
    
    const sentMessages = messages.filter(msg => msg.direction === 'outbound').length;
    const receivedMessages = messages.filter(msg => msg.direction === 'inbound').length;
    
    // Calculate unread messages (inbound messages that haven't been read)
    const unreadMessages = messages.filter(msg => 
      msg.direction === 'inbound' && msg.status !== 'read'
    ).length;

    return {
      totalContacts,
      messagesToday,
      sentMessages,
      receivedMessages,
      unreadMessages,
    };
  }, [contacts, messages, dashboardStats]);

  const { totalContacts, messagesToday, sentMessages, receivedMessages, unreadMessages } = stats;
  
  // Calculate delivered messages
  const deliveredMessages = messages.filter(msg => 
    msg.direction === 'outbound' && msg.status === 'delivered'
  ).length;
  
  // Calculate response rate more accurately
  // Group messages by contact and check if we've responded to each contact's received messages
  const contactResponseMap = new Map<number, { received: number; responded: boolean }>();
  
  messages.forEach(msg => {
    if (!contactResponseMap.has(msg.contact_id)) {
      contactResponseMap.set(msg.contact_id, { received: 0, responded: false });
    }
    
    const contactData = contactResponseMap.get(msg.contact_id)!;
    
    if (msg.direction === 'inbound') {
      contactData.received++;
    } else if (msg.direction === 'outbound') {
      contactData.responded = true;
    }
  });
  
  // Calculate response rate based on contacts we've responded to
  const contactsWithMessages = Array.from(contactResponseMap.values()).filter(c => c.received > 0);
  const contactsRespondedTo = contactsWithMessages.filter(c => c.responded).length;
  const responseRate = contactsWithMessages.length > 0 
    ? Math.round((contactsRespondedTo / contactsWithMessages.length) * 100)
    : 0;

  // Get recent messages with contact names
  const recentMessages = messages
    .sort((a, b) => new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime())
    .slice(0, 4)
    .map(msg => {
      const contact = contacts.find(c => c.id === msg.contact_id);
      const timeAgo = getTimeAgo(new Date(msg.created_at || new Date()));
      return {
        id: msg.id!,
        contact: contact?.name || 'Unknown Contact',
        message: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        time: timeAgo,
        unread: msg.direction === 'inbound' && msg.status !== 'read'
      };
    });

  const dashboardStatsCards = [
    { 
      title: "Messages Today", 
      value: messagesToday.toString(), 
      change: messagesToday > 0 ? `+${messagesToday}` : "0", 
      icon: MessageSquare, 
      color: "text-primary" 
    },
    { 
      title: "Total Contacts", 
      value: totalContacts.toString(), 
      change: dashboardStats?.contacts.active ? `${dashboardStats.contacts.active} active` : "0 active", 
      icon: Users, 
      color: "text-success" 
    },
    { 
      title: "Messages Sent", 
      value: sentMessages.toString(), 
      change: deliveredMessages > 0 ? `${deliveredMessages} delivered` : "0 delivered", 
      icon: Send, 
      color: "text-warning" 
    },
    { 
      title: "Response Rate", 
      value: `${responseRate}%`, 
      change: responseRate > 0 ? `+${responseRate}%` : "0%", 
      icon: TrendingUp, 
      color: "text-primary" 
    },
  ];

  // Helper function to format time ago
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }

  if (activeTab !== "dashboard") return null;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's your RX messaging overview for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
                      <Button 
              size="sm" 
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => setActiveTab("messages")}
            >
              <Send className="w-4 h-4 mr-2" />
              Quick Message
            </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStatsCards.map((stat, index) => (
          <Card key={index} className="bg-card border-border shadow-card hover:shadow-glow transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </span>
                    <span className={`text-xs font-medium ${stat.color}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <Card className="lg:col-span-2 bg-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Recent Messages</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {unreadMessages} unread
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-accent/50 ${
                    msg.unread ? "bg-primary/5 border-primary/20" : "bg-transparent border-border"
                  }`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {msg.contact.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-foreground">
                        {msg.contact}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {msg.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {msg.message}
                    </p>
                  </div>
                  {msg.unread && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  )}
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-primary hover:bg-primary/10"
              onClick={() => setActiveTab("messages")}
            >
              View All Messages
            </Button>
          </CardContent>
        </Card>

        {/* Message Statistics */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Message Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-primary/5">
                  <div className="text-2xl font-bold text-primary">{messagesToday}</div>
                  <div className="text-sm text-muted-foreground">Messages Today</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-success/5">
                  <div className="text-2xl font-bold text-success">{deliveredMessages}</div>
                  <div className="text-sm text-muted-foreground">Delivered</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/5">
                  <div className="text-2xl font-bold text-warning">{unreadMessages}</div>
                  <div className="text-sm text-muted-foreground">Unread</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-foreground">{receivedMessages}</div>
                  <div className="text-sm text-muted-foreground">Received</div>
                </div>
              </div>
              
              {/* Additional stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{sentMessages}</div>
                  <div className="text-xs text-muted-foreground">Total Sent</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{dashboardStats?.messages.ai_generated || 0}</div>
                  <div className="text-xs text-muted-foreground">AI Generated</div>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-primary hover:bg-primary/10"
              onClick={() => setActiveTab("messages")}
            >
              View All Messages
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary Section */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Daily Summary
            </div>
            <div className="flex items-center gap-2">
              {!dailySummary && (
                <Button 
                  onClick={handleGenerateDailySummary}
                  disabled={isGeneratingSummary}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isGeneratingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Summary
                </Button>
              )}
              {dailySummary && !isEditingSummary && (
                <>
                  <Button 
                    onClick={() => setActiveTab("daily-summaries")}
                    size="sm"
                    variant="outline"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                  <Button 
                    onClick={() => setIsEditingSummary(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
              {dailySummary && isEditingSummary && (
                <Button 
                  onClick={handleSaveDailySummary}
                  disabled={isSavingSummary}
                  size="sm"
                  className="bg-success hover:bg-success/90"
                >
                  {isSavingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!dailySummary ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No daily summary generated yet. Click "Generate Summary" to create an AI-powered summary of today's conversations.
              </p>
              <Button 
                onClick={() => setActiveTab("daily-summaries")}
                variant="outline"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            </div>
          ) : isEditingSummary ? (
            <div className="space-y-4">
              <Textarea
                value={editedMarkdown}
                onChange={(e) => setEditedMarkdown(e.target.value)}
                placeholder="Edit the daily summary markdown..."
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    setIsEditingSummary(false);
                    setEditedMarkdown(dailySummary.markdown_content || "");
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveDailySummary}
                  disabled={isSavingSummary}
                  size="sm"
                  className="bg-success hover:bg-success/90"
                >
                  {isSavingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                  {dailySummary.markdown_content}
                </pre>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Last updated: {new Date(dailySummary.updated_at).toLocaleString()}</span>
                <span>Generated: {new Date(dailySummary.created_at).toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});