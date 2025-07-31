import { useState, useEffect, useCallback } from "react";
import { Calendar, FileText, Edit3, Trash2, Search, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface DailySummariesProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DailySummaries = ({ activeTab, setActiveTab }: DailySummariesProps) => {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState("");
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

  // Filter summaries based on search term
  const filteredSummaries = summaries.filter(summary => 
    summary.date.includes(searchTerm) ||
    summary.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.contacts.some(contact => contact.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle viewing a summary
  const handleViewSummary = (summary: DailySummary) => {
    setSelectedSummary(summary);
    setEditedMarkdown(summary.markdown_content || "");
    setIsEditing(false);
  };

  // Handle editing a summary
  const handleEditSummary = (summary: DailySummary) => {
    setSelectedSummary(summary);
    setEditedMarkdown(summary.markdown_content || "");
    setIsEditing(true);
  };

  // Handle saving edited summary
  const handleSaveSummary = async () => {
    if (!selectedSummary) return;
    
    setIsSaving(true);
    try {
      // Extract just the date part (YYYY-MM-DD) from the full timestamp
      const dateOnly = selectedSummary.date.split('T')[0];
      const response = await ApiClient.updateDailySummary(dateOnly, editedMarkdown);
      if (response.success) {
        setSelectedSummary(prev => prev ? { ...prev, markdown_content: editedMarkdown } : null);
        setIsEditing(false);
        fetchSummaries(); // Refresh the list
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
  const handleDeleteSummary = async (summary: DailySummary) => {
    if (!confirm(`Are you sure you want to delete the daily summary for ${summary.date}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Extract just the date part (YYYY-MM-DD) from the full timestamp
      const dateOnly = summary.date.split('T')[0];
      const response = await ApiClient.deleteDailySummary(dateOnly);
      if (response.success) {
        fetchSummaries(); // Refresh the list
        if (selectedSummary?.id === summary.id) {
          setSelectedSummary(null);
        }
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
              Daily Summaries
            </h1>
            <p className="text-muted-foreground mt-2">
              Review and manage your historical daily summaries
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary List */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Summary History
              </CardTitle>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search summaries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredSummaries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No summaries match your search" : "No daily summaries found"}
                  </div>
                ) : (
                  filteredSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent ${
                        selectedSummary?.id === summary.id ? "bg-accent border-primary" : "border-border"
                      }`}
                      onClick={() => handleViewSummary(summary)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {new Date(summary.date).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {summary.contacts.length} contacts
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {summary.action_items.length} actions
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {summary.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSummary(summary);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSummary(summary);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Detail */}
        <div className="lg:col-span-2">
          {selectedSummary ? (
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Daily Summary - {new Date(selectedSummary.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button 
                          onClick={() => {
                            setIsEditing(false);
                            setEditedMarkdown(selectedSummary.markdown_content || "");
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveSummary}
                          disabled={isSaving}
                          size="sm"
                          className="bg-success hover:bg-success/90"
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editedMarkdown}
                      onChange={(e) => setEditedMarkdown(e.target.value)}
                      placeholder="Edit the daily summary markdown..."
                      className="min-h-[500px] font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                        {selectedSummary.markdown_content}
                      </pre>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Last updated: {new Date(selectedSummary.updated_at).toLocaleString()}</span>
                      <span>Generated: {new Date(selectedSummary.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border shadow-card">
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a daily summary from the list to view its details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 