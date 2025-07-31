import { useState, useEffect, useCallback } from "react";
import { Calendar, FileText, Plus, Edit3, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ApiClient } from "@/lib/supabase-api";

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

interface DailySummaryCalendarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DailySummaryCalendar = ({ activeTab, setActiveTab }: DailySummaryCalendarProps) => {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  // Fetch all daily summaries
  const fetchSummaries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiClient.getAllDailySummaries();
      if (response.success) {
        setSummaries(response.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch daily summaries",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching daily summaries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch daily summaries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "daily-summaries") {
      fetchSummaries();
    }
  }, [activeTab, fetchSummaries]);

  // Get calendar data for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Get summary for a specific date
  const getSummaryForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return summaries.find(summary => summary.date === dateString);
  };

  // Check if date has a summary
  const hasSummary = (date: Date) => {
    return getSummaryForDate(date) !== undefined;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(dateString);
    
    const summary = getSummaryForDate(date);
    if (summary) {
      setSelectedSummary(summary);
      setEditedContent(summary.markdown_content || "");
      setIsEditing(false);
      setIsCreating(false);
    } else {
      setSelectedSummary(null);
      setEditedContent("");
      setIsCreating(true);
      setIsEditing(false);
    }
  };

  // Handle creating a new summary
  const handleCreateSummary = async () => {
    if (!selectedDate || !editedContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter content for the daily summary",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Extract just the date part (YYYY-MM-DD) from the full timestamp
      const dateOnly = selectedDate.split('T')[0];
      const response = await ApiClient.updateDailySummary(dateOnly, editedContent);
      if (response.success) {
        await fetchSummaries(); // Refresh the list
        const newSummary = summaries.find(s => s.date === selectedDate) || {
          id: Date.now(),
          date: selectedDate,
          summary: "New summary",
          key_points: [],
          action_items: [],
          contacts: [],
          markdown_content: editedContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSelectedSummary(newSummary);
        setIsCreating(false);
        toast({
          title: "Summary Created",
          description: "Daily summary has been created successfully",
        });
      } else {
        toast({
          title: "Create Failed",
          description: response.error || "Failed to create daily summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to create daily summary:', error);
      toast({
        title: "Error",
        description: "Failed to create daily summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle saving edited summary
  const handleSaveSummary = async () => {
    if (!selectedSummary || !editedContent.trim()) return;
    
    setIsSaving(true);
    try {
      // Extract just the date part (YYYY-MM-DD) from the full timestamp
      const dateOnly = selectedSummary.date.split('T')[0];
      const response = await ApiClient.updateDailySummary(dateOnly, editedContent);
      if (response.success) {
        setSelectedSummary(prev => prev ? { ...prev, markdown_content: editedContent } : null);
        setIsEditing(false);
        await fetchSummaries(); // Refresh the list
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
      setIsSaving(false);
    }
  };

  // Handle deleting a summary
  const handleDeleteSummary = async () => {
    if (!selectedSummary) return;

    if (!confirm(`Are you sure you want to delete the daily summary for ${selectedSummary.date}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Extract just the date part (YYYY-MM-DD) from the full timestamp
      const dateOnly = selectedSummary.date.split('T')[0];
      const response = await ApiClient.deleteDailySummary(dateOnly);
      if (response.success) {
        await fetchSummaries(); // Refresh the list
        setSelectedSummary(null);
        setSelectedDate(null);
        setEditedContent("");
        setIsCreating(false);
        setIsEditing(false);
        toast({
          title: "Summary Deleted",
          description: "Daily summary has been deleted successfully",
        });
      } else {
        toast({
          title: "Delete Failed",
          description: response.error || "Failed to delete daily summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete daily summary:', error);
      toast({
        title: "Error",
        description: "Failed to delete daily summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    handleDateSelect(today);
  };

  if (activeTab !== "daily-summaries") return null;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading daily summaries...</p>
        </div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setActiveTab("dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Daily Summary Calendar
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage your daily summaries with an interactive calendar
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Calendar View
              </CardTitle>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToToday}
                  >
                    Today
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate === day.toISOString().split('T')[0];
                  const hasSummaryForDay = hasSummary(day);
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 text-center text-sm cursor-pointer rounded-md transition-all hover:bg-accent ${
                        !isCurrentMonth ? "text-muted-foreground/50" : ""
                      } ${
                        isToday ? "bg-primary text-primary-foreground font-bold" : ""
                      } ${
                        isSelected ? "ring-2 ring-primary" : ""
                      } ${
                        hasSummaryForDay ? "bg-green-100 dark:bg-green-900/20" : ""
                      }`}
                      onClick={() => handleDateSelect(day)}
                    >
                      <div className="relative">
                        {day.getDate()}
                        {hasSummaryForDay && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Content */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {selectedDate ? (
                    `Daily Summary - ${new Date(selectedDate).toLocaleDateString()}`
                  ) : (
                    "Select a date to view or create a summary"
                  )}
                </div>
                {selectedSummary && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDeleteSummary}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click on a date in the calendar to view or create a daily summary</p>
                </div>
              ) : selectedSummary ? (
                <div className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="Enter your daily summary content..."
                        className="min-h-[300px]"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSaveSummary}
                          disabled={isSaving}
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(selectedSummary.markdown_content || "");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {selectedSummary.markdown_content || "No content available"}
                        </div>
                      </div>
                      
                      {/* Summary Stats */}
                      <div className="flex items-center gap-4 pt-4 border-t border-border">
                        <Badge variant="secondary">
                          {selectedSummary.contacts.length} contacts
                        </Badge>
                        <Badge variant="outline">
                          {selectedSummary.action_items.length} action items
                        </Badge>
                        <Badge variant="outline">
                          {selectedSummary.key_points.length} key points
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      No summary exists for {new Date(selectedDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Create a new daily summary by entering content below
                    </p>
                  </div>
                  
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Enter your daily summary content..."
                    className="min-h-[300px]"
                  />
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCreateSummary}
                      disabled={isSaving || !editedContent.trim()}
                    >
                      {isSaving ? "Creating..." : "Create Summary"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedDate(null);
                        setEditedContent("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 