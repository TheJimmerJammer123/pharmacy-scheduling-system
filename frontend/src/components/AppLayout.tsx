import { useState, useEffect, lazy, Suspense } from "react";
import { Home, MessageSquare, Users, Settings, Menu, X, Store, User, Bot, Upload } from "@/lib/icons";
// import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "./LoadingSpinner";
import { apiService } from "@/services/apiService";

// Lazy load large components
const Dashboard = lazy(() => import("./Dashboard").then(module => ({ default: module.Dashboard })));
const MessagingInterface = lazy(() => import("./MessagingInterface").then(module => ({ default: module.MessagingInterface })));
const ContactManagement = lazy(() => import("./ContactManagement").then(module => ({ default: module.ContactManagement })));
const SettingsComponent = lazy(() => import("./Settings").then(module => ({ default: module.Settings })));
// Daily Summary Calendar temporarily disabled
const StoreScheduling = lazy(() => import("./StoreScheduling").then(module => ({ default: module.StoreScheduling })));
const EmployeeScheduling = lazy(() => import("./EmployeeScheduling").then(module => ({ default: module.EmployeeScheduling })));
const ChatbotInterface = lazy(() => import("./ChatbotInterface").then(module => ({ default: module.ChatbotInterface })));
const DocumentUpload = lazy(() => import("./DocumentUpload").then(module => ({ default: module.DocumentUpload })));

export const AppLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Auto-login hook
  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Check if already authenticated
        const existingToken = localStorage.getItem('authToken');
        if (existingToken) {
          console.log('✅ Already authenticated with existing token');
          setAuthReady(true);
          return;
        }
        
        console.log('🔐 Auto-login: Starting authentication...');
        
        // Login with admin credentials
        const backendUrl = (() => {
          const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
          if (envUrl && envUrl.trim().length > 0) return envUrl;
          try {
            const protocol = typeof window !== 'undefined' && window.location?.protocol ? window.location.protocol : 'http:';
            const hostname = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
            const port = '3001';
            return `${protocol}//${hostname}:${port}`;
          } catch (_) {
            return 'http://100.120.219.68:3001';
          }
        })();
        const response = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.token) {
            localStorage.setItem('authToken', data.token);
            apiService.setAuthToken(data.token);
            console.log('✅ Auto-login successful!', data.user);
          }
        }
      } catch (error) {
        console.error('❌ Auto-login failed:', error);
      } finally {
        setAuthReady(true);
      }
    };
    
    autoLogin();
  }, []);

  // Fetch unread message count  
  const fetchUnreadCount = async () => {
    try {
      // Get all contacts first, then get messages for each
      const contacts = await apiService.getContacts();
      let totalUnreadCount = 0;
      
      if (contacts) {
        for (const contact of contacts.slice(0, 10)) { // Limit to first 10 contacts for performance
          try {
            const messages = await apiService.getMessages(contact.id, { limit: 50 });
            const unreadCount = messages.filter(msg => 
              msg.direction === 'inbound' && msg.status !== 'read'
            ).length;
            totalUnreadCount += unreadCount;
          } catch (msgError) {
            // Skip this contact if messages fail to load
            console.warn(`Failed to load messages for contact ${contact.id}:`, msgError);
          }
        }
      }
      
      console.log('[AppLayout] Total unread message count:', totalUnreadCount);
      setUnreadMessageCount(totalUnreadCount);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      // Set to 0 if we can't fetch
      setUnreadMessageCount(0);
    }
  };

  // Fetch unread count on mount and when refreshTrigger changes
  useEffect(() => {
    fetchUnreadCount();
  }, [refreshTrigger]);

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: Home, badge: null },
    { id: "messages", name: "Messages", icon: MessageSquare, badge: unreadMessageCount > 0 ? unreadMessageCount : null },
    { id: "chatbot", name: "AI Assistant", icon: Bot, badge: null },
    { id: "document-upload", name: "Document Upload", icon: Upload, badge: null },
    { id: "store-scheduling", name: "Store Scheduling", icon: Store, badge: null },
    { id: "employee-scheduling", name: "Employee Scheduling", icon: User, badge: null },
    { id: "contacts", name: "Contacts", icon: Users, badge: null },
    { id: "settings", name: "Settings", icon: Settings, badge: null },
  ];

  const currentNav = navigation.find(nav => nav.id === activeTab);

  // Render only the active component
  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} refreshTrigger={refreshTrigger} />
          </Suspense>
        );
      case "messages":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <MessagingInterface activeTab={activeTab} onDataChange={() => {
              console.log('[AppLayout] onDataChange called, incrementing refreshTrigger from', refreshTrigger);
              setRefreshTrigger(prev => prev + 1);
              console.log('[AppLayout] refreshTrigger incremented to', refreshTrigger + 1);
            }} />
          </Suspense>
        );
      case "contacts":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ContactManagement activeTab={activeTab} setActiveTab={setActiveTab} />
          </Suspense>
        );
      case "settings":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsComponent activeTab={activeTab} />
          </Suspense>
        );
      case "store-scheduling":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <StoreScheduling activeTab={activeTab} setActiveTab={setActiveTab} />
          </Suspense>
        );
      case "employee-scheduling":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <EmployeeScheduling activeTab={activeTab} setActiveTab={setActiveTab} />
          </Suspense>
        );
      case "chatbot":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ChatbotInterface activeTab={activeTab} />
          </Suspense>
        );
      case "document-upload":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DocumentUpload />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} refreshTrigger={refreshTrigger} />
          </Suspense>
        );
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            RX Scheduler
          </h1>
        </div>
        <Avatar className="w-8 h-8">
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-3 p-6 border-b border-border">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  RX Scheduler
                </h1>
                <p className="text-xs text-muted-foreground">v1.0.0</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={`w-full justify-start h-12 ${
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">John Scheduler</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              {currentNav && (
                <>
                  <currentNav.icon className="w-6 h-6 text-primary" />
                  <span className="text-xl font-semibold text-foreground">
                    {currentNav.name}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <Avatar className="w-8 h-8">
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {renderActiveComponent()}
          </main>
        </div>
      </div>
    </div>
  );
};