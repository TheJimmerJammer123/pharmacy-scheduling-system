import { useState, useEffect, useCallback, useMemo } from "react";
import { User, MessageSquare, Bell, Download, Monitor, CheckCircle, AlertCircle, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";

interface SettingsProps {
  activeTab: string;
}

// Proper types for system status
interface SystemStatus {
  status: string;
  timestamp: string;
  services: {
    database: string;
    ai: string;
    capcom6: string;
  };
}

// Settings interfaces
interface UserSettings {
  name: string;
  email: string;
  phone: string;
  timezone: string;
}

interface SmsSettings {
  defaultSignature: string;
  autoRespond: boolean;
  businessHours: boolean;
  maxMessageLength: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  soundAlerts: boolean;
  desktopNotifications: boolean;
  newMessageAlert: boolean;
}

interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export const Settings = ({ activeTab }: SettingsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemStatusLoading, setSystemStatusLoading] = useState(false);
  const [systemStatusError, setSystemStatusError] = useState<string | null>(null);
  
  // Persistent Settings state (safe defaults) - wrapped in useMemo to prevent re-creation
  const defaultUserSettings: UserSettings = useMemo(() => ({
    name: "Admin User",
    email: "admin@example.com",
    phone: "",
    timezone: "America/New_York",
  }), []);
  
  const defaultSmsSettings: SmsSettings = useMemo(() => ({
    defaultSignature: "",
    autoRespond: false,
    businessHours: true,
    maxMessageLength: 160,
  }), []);
  
  const defaultNotificationSettings: NotificationSettings = useMemo(() => ({
    emailNotifications: true,
    soundAlerts: true,
    desktopNotifications: false,
    newMessageAlert: true,
  }), []);
  
  const defaultThemeSettings: ThemeSettings = useMemo(() => ({
    theme: "system",
    compactMode: false,
    fontSize: "medium",
  }), []);

  const [userSettings, setUserSettings] = useState<UserSettings>(defaultUserSettings);
  const [smsSettings, setSmsSettings] = useState<SmsSettings>(defaultSmsSettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);

  // Helper to apply theme to <html>
  const applyTheme = useCallback((theme: string) => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  // Hydrate settings from localStorage after mount (browser-only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const hydrateSettings = () => {
    try {
      const savedUser = localStorage.getItem("settings_userProfile");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUserSettings({ ...defaultUserSettings, ...parsed });
        }
      } catch (error) {
        console.error('Failed to parse user settings:', error);
      setUserSettings(defaultUserSettings);
    }
      
    try {
      const savedSms = localStorage.getItem("settings_sms");
        if (savedSms) {
          const parsed = JSON.parse(savedSms);
          setSmsSettings({ ...defaultSmsSettings, ...parsed });
        }
      } catch (error) {
        console.error('Failed to parse SMS settings:', error);
      setSmsSettings(defaultSmsSettings);
    }
      
    try {
      const savedNotif = localStorage.getItem("settings_notifications");
        if (savedNotif) {
          const parsed = JSON.parse(savedNotif);
          setNotificationSettings({ ...defaultNotificationSettings, ...parsed });
        }
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      setNotificationSettings(defaultNotificationSettings);
    }
      
    try {
      const savedTheme = localStorage.getItem("settings_theme");
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme);
          const themeSettings = { ...defaultThemeSettings, ...parsed };
          setThemeSettings(themeSettings);
          applyTheme(themeSettings.theme);
      } else {
        applyTheme(defaultThemeSettings.theme);
      }
      } catch (error) {
        console.error('Failed to parse theme settings:', error);
      setThemeSettings(defaultThemeSettings);
      applyTheme(defaultThemeSettings.theme);
    }
    };

    hydrateSettings();
  }, [defaultUserSettings, defaultSmsSettings, defaultNotificationSettings, defaultThemeSettings, applyTheme]);

  // Listen for system theme changes if "system" is selected
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (themeSettings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeSettings.theme, applyTheme]);

  // Apply theme immediately when themeSettings.theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    applyTheme(themeSettings.theme);
  }, [themeSettings.theme, applyTheme]);

  // Apply font size and compact mode classes to <html>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;

    // Font size
    root.classList.remove("font-size-small", "font-size-medium", "font-size-large");
    root.classList.add(`font-size-${themeSettings.fontSize}`);

    // Compact mode
    if (themeSettings.compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }
  }, [themeSettings.fontSize, themeSettings.compactMode]);

  // Fetch system status with proper error handling
  const fetchSystemStatus = useCallback(async () => {
    setSystemStatusLoading(true);
    setSystemStatusError(null);
      try {
      // TODO: Implement health check in the new backend
      // For now, show placeholder status
      const placeholderStatus: SystemStatus = {
        status: 'operational',
        timestamp: new Date().toISOString(),
        services: {
          database: 'operational',
          ai: 'operational',
          capcom6: 'operational'
        }
      };
      setSystemStatus(placeholderStatus);
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      setSystemStatusError('Network error - backend may be offline');
    } finally {
      setSystemStatusLoading(false);
      }
  }, []);

  useEffect(() => {
    if (activeTab === "settings") {
      fetchSystemStatus();
    }
  }, [activeTab, fetchSystemStatus]);

  const handleSaveSettings = async (section: string) => {
    setIsLoading(true);
    try {
      // Persist settings to localStorage by section
      if (section === "User Profile") {
        localStorage.setItem("settings_userProfile", JSON.stringify(userSettings));
      } else if (section === "SMS") {
        localStorage.setItem("settings_sms", JSON.stringify(smsSettings));
      } else if (section === "Notification") {
        localStorage.setItem("settings_notifications", JSON.stringify(notificationSettings));
      } else if (section === "Theme") {
        localStorage.setItem("settings_theme", JSON.stringify(themeSettings));
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const [contacts, messages] = await Promise.all([
        apiService.getContacts(),
        apiService.getMessages()
      ]);

      if (contacts && messages) {
        const exportData = {
          contacts,
          messages,
          exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sms-data-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        // Use modern download approach
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Data Exported",
          description: "Your SMS data has been exported successfully.",
        });
      } else {
        throw new Error('Failed to fetch data for export');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (activeTab !== "settings") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your SMS messaging and logging preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile Settings */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={userSettings.name}
                  onChange={(e) => setUserSettings({...userSettings, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userSettings.email}
                  onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={userSettings.phone}
                onChange={(e) => setUserSettings({...userSettings, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={userSettings.timezone} onValueChange={(value) => setUserSettings({...userSettings, timezone: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleSaveSettings("User Profile")} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* SMS Settings */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Message Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature">Default Signature</Label>
              <Textarea
                id="signature"
                value={smsSettings.defaultSignature}
                onChange={(e) => setSmsSettings({...smsSettings, defaultSignature: e.target.value})}
                placeholder="- Your Business Name"
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-respond</Label>
                <p className="text-sm text-muted-foreground">Automatically respond to new messages</p>
              </div>
              <Switch
                checked={smsSettings.autoRespond}
                onCheckedChange={(checked) => setSmsSettings({...smsSettings, autoRespond: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Business Hours Only</Label>
                <p className="text-sm text-muted-foreground">Only send messages during business hours</p>
              </div>
              <Switch
                checked={smsSettings.businessHours}
                onCheckedChange={(checked) => setSmsSettings({...smsSettings, businessHours: checked})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLength">Max Message Length</Label>
              <Select value={smsSettings.maxMessageLength.toString()} onValueChange={(value) => setSmsSettings({...smsSettings, maxMessageLength: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="160">160 characters (1 message)</SelectItem>
                  <SelectItem value="320">320 characters (2 messages)</SelectItem>
                  <SelectItem value="480">480 characters (3 messages)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleSaveSettings("SMS")} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Message Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email alerts for new messages</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sound Alerts</Label>
                <p className="text-sm text-muted-foreground">Play sound when messages are received</p>
              </div>
              <Switch
                checked={notificationSettings.soundAlerts}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, soundAlerts: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">Show browser notifications</p>
              </div>
              <Switch
                checked={notificationSettings.desktopNotifications}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, desktopNotifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Message Alerts</Label>
                <p className="text-sm text-muted-foreground">Highlight new incoming messages</p>
              </div>
              <Switch
                checked={notificationSettings.newMessageAlert}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, newMessageAlert: checked})}
              />
            </div>
            <Button onClick={() => handleSaveSettings("Notification")} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Notification Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Theme & Display */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Theme & Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={themeSettings.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => {
                  setThemeSettings((prev) => {
                    const next = { ...prev, theme: value };
                    // Persist immediately
                    localStorage.setItem("settings_theme", JSON.stringify(next));
                    return next;
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={themeSettings.fontSize}
                onValueChange={(value: 'small' | 'medium' | 'large') => {
                  const next = { ...themeSettings, fontSize: value };
                  setThemeSettings(next);
                  localStorage.setItem("settings_theme", JSON.stringify(next));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">Use compact layout for more content</p>
              </div>
              <Switch
                checked={themeSettings.compactMode}
                onCheckedChange={(checked) => {
                  const next = { ...themeSettings, compactMode: checked };
                  setThemeSettings(next);
                  localStorage.setItem("settings_theme", JSON.stringify(next));
                }}
              />
            </div>
            <Button onClick={() => handleSaveSettings("Theme")} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Display Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              System Status
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchSystemStatus}
                disabled={systemStatusLoading}
                className="ml-auto"
              >
                {systemStatusLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemStatusError ? (
              <div className="text-center py-4">
                <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">{systemStatusError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchSystemStatus}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : systemStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Database Connection</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">Connected</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Capcom6 SMS Service</span>
                  <div className="flex items-center gap-2">
                    {systemStatus.services?.capcom6 === 'configured' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">Active</Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">Not Configured</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Service</span>
                  <div className="flex items-center gap-2">
                    {systemStatus.services?.ai === 'configured' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500">Active</Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">Not Configured</Badge>
                      </>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <p>Last Updated: {new Date(systemStatus.timestamp).toLocaleString()}</p>
                  <p>Status: {systemStatus.status}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading system status...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a backup of all your contacts and messages
              </p>
              <Button onClick={handleExportData} variant="outline" className="w-full" disabled={isLoading}>
                <Download className="w-4 h-4 mr-2" />
                {isLoading ? "Exporting..." : "Export All Data"}
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Data Retention</h4>
              <p className="text-sm text-muted-foreground">
                Messages are stored indefinitely. Export regularly for backup.
              </p>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <p><strong>💾 Storage:</strong> MariaDB database with connection pooling</p>
                <p><strong>🔒 Security:</strong> Local storage only</p>
                <p><strong>📱 SMS History:</strong> All messages preserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 