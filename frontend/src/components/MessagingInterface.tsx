import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Send, Search, MoreVertical, Clock, Check, CheckCheck, Trash2, Loader2, Sparkles, FileText, Store } from "@/lib/icons";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ApiClient, ContactWithLastMessage, Message } from "@/lib/supabase-api";

interface MessagingInterfaceProps {
  activeTab: string;
  onDataChange?: () => void;
}

interface ConversationSummary {
  id: number;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  priority: 'low' | 'medium' | 'high';
  extractedData?: {
    storeNumber: string;
    storeLocation: string;
    shiftDate: string;
    shiftTime: string;
    availability: string;
    constraints: string;
    confidence?: {
      overall: number;
      storeNumber: number;
      storeLocation: number;
      shiftDate: number;
      shiftTime: number;
      availability: number;
    };
  };
}

export const MessagingInterface = memo(({ activeTab, onDataChange }: MessagingInterfaceProps) => {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [requiresAcknowledgment, setRequiresAcknowledgment] = useState(false);
  const [contacts, setContacts] = useState<ContactWithLastMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Summarization state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<ConversationSummary | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isAddingToDailySummary, setIsAddingToDailySummary] = useState(false);

  // Selection state for bulk operations
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Selection state for summarization
  const [selectedForSummarization, setSelectedForSummarization] = useState<Set<number>>(new Set());
  const [isSummarizationSelectionMode, setIsSummarizationSelectionMode] = useState(false);
  const [selectedStoreNumber, setSelectedStoreNumber] = useState<number>(1);

  // --- Logging state on render ---
  console.log("[MessagingInterface] Render", {
    activeTab,
    selectedContactId,
    contactsCount: contacts.length,
    messagesCount: messages.length,
  });

  const { toast } = useToast();

  // Fetch contacts with last message info
  const fetchContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    setError(null);

    console.log("[MessagingInterface] fetchContacts: Fetching contacts with last message info");
    try {
      const response = await ApiClient.getContactsWithMessages();
      console.log("[MessagingInterface] fetchContacts: Response", response);

      if (response.success && response.data) {
        setContacts(response.data);
        // Auto-select first contact if none selected
        if (!selectedContactId && response.data.length > 0) {
          setSelectedContactId(response.data[0].id!);
        }
      } else {
        setError(response.error || "Failed to fetch contacts");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to fetch contacts"
        });
        console.error("[MessagingInterface] fetchContacts: Error", response.error);
      }
    } catch (err) {
      setError("Exception in fetchContacts");
      console.error("[MessagingInterface] fetchContacts: Exception", err);
    }

    setIsLoadingContacts(false);
  }, [selectedContactId, toast]);

  // Fetch messages for selected contact
  const fetchMessages = useCallback(async (contactId: number) => {
    setIsLoadingMessages(true);

    console.log("[MessagingInterface] fetchMessages: Fetching messages for contactId", contactId);
    try {
      const response = await ApiClient.getContactMessages(contactId);
      console.log("[MessagingInterface] fetchMessages: Response", response);

      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to fetch messages"
        });
        console.error("[MessagingInterface] fetchMessages: Error", response.error);
      }
    } catch (err) {
      console.error("[MessagingInterface] fetchMessages: Exception", err);
    }

    setIsLoadingMessages(false);
  }, [toast]);

  // Always fetch contacts on mount and when switching to messages tab
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts, activeTab]);

  // Always fetch messages when selectedContactId changes, or when contacts change and a contact is selected
  useEffect(() => {
    if (selectedContactId && contacts.length > 0) {
      // Verify the contact exists before fetching messages
      const contactExists = contacts.some(c => c.id === selectedContactId);
      if (!contactExists) {
        console.warn("[MessagingInterface] useEffect: Selected contact not found in contacts list", { selectedContactId, contactsCount: contacts.length });
        setSelectedContactId(null);
        return;
      }
      
      fetchMessages(selectedContactId);
      // Clear selection modes when switching contacts
      setIsSelectionMode(false);
      setIsSummarizationSelectionMode(false);
      setSelectedMessages(new Set());
      setSelectedForSummarization(new Set());
    }
  }, [selectedContactId, contacts, fetchMessages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContactId || isSending) return;

    setIsSending(true);

    console.log("[MessagingInterface] handleSendMessage: Sending SMS", {
      selectedContactId,
      newMessage,
      requiresAcknowledgment,
    });

    try {
      const response = await ApiClient.sendSMS(selectedContactId, newMessage.trim(), requiresAcknowledgment);
      console.log("[MessagingInterface] handleSendMessage: Response", response);

      if (response.success) {
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully"
        });
        setNewMessage("");
        setRequiresAcknowledgment(false); // Reset acknowledgment setting
        // Refresh messages to show the new one
        await fetchMessages(selectedContactId);
        // Refresh contacts to update last message
        await fetchContacts();
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send message",
          description: response.error || "Could not send message"
        });
        console.error("[MessagingInterface] handleSendMessage: Error", response.error);
      }
    } catch (err) {
      console.error("[MessagingInterface] handleSendMessage: Exception", err);
    }

    setIsSending(false);
  };

  // Handle deleting a message
  // const handleDeleteMessage = async (messageId: number, messageContent: string) => {
  //   if (!confirm(`Are you sure you want to delete this message: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"?`)) {
  //     return;
  //   }

  //   console.log("[MessagingInterface] handleDeleteMessage: Deleting message", { messageId, messageContent });

  //   try {
  //     const response = await ApiClient.deleteMessage(messageId);
  //     console.log("[MessagingInterface] handleDeleteMessage: Response", response);

  //     if (response.success) {
  //       toast({
  //         title: "Message deleted",
  //         description: "The message has been deleted successfully"
  //       });
  //       // Refresh messages
  //       if (selectedContactId) {
  //         await fetchMessages(selectedContactId);
  //         await fetchContacts(); // Update last message in contact list
  //       }
  //     } else {
  //       toast({
  //         variant: "destructive",
  //         title: "Failed to delete message",
  //         description: response.error || "Could not delete message"
  //       });
  //       console.error("[MessagingInterface] handleDeleteMessage: Error", response.error);
  //     }
  //   } catch (err) {
  //     console.error("[MessagingInterface] handleDeleteMessage: Exception", err);
  //   }
  // };

  // Handle deleting entire conversation
  const handleDeleteConversation = async () => {
    console.log("[MessagingInterface] handleDeleteConversation: Starting...");
    
    if (!selectedContactId) {
      console.log("[MessagingInterface] handleDeleteConversation: No selectedContactId");
      return;
    }

    const contactName = contacts.find(c => c.id === selectedContactId)?.name || 'this contact';
    console.log("[MessagingInterface] handleDeleteConversation: Contact name:", contactName);
    
    if (!confirm(`Are you sure you want to delete ALL messages with ${contactName}? This action cannot be undone.`)) {
      console.log("[MessagingInterface] handleDeleteConversation: User cancelled");
      return;
    }

    console.log("[MessagingInterface] handleDeleteConversation: Deleting all messages for contact", selectedContactId);

    try {
      // Delete all messages for this contact
      const deletePromises = messages.map(message => 
        ApiClient.deleteMessage(message.id!)
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: "Conversation deleted",
        description: `All messages with ${contactName} have been deleted successfully`
      });
      
      // Refresh messages and contacts
      await fetchMessages(selectedContactId);
      await fetchContacts();
      
    } catch (err) {
      console.error("[MessagingInterface] handleDeleteConversation: Exception", err);
      toast({
        variant: "destructive",
        title: "Failed to delete conversation",
        description: "Some messages may not have been deleted. Please try again."
      });
    }
  };

  // Handle bulk delete selected messages
  const handleBulkDelete = async () => {
    if (selectedMessages.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedMessages.size} selected message(s)? This action cannot be undone.`)) {
      return;
    }

    console.log("[MessagingInterface] handleBulkDelete: Deleting selected messages", Array.from(selectedMessages));

    try {
      // Delete selected messages
      const deletePromises = Array.from(selectedMessages).map(messageId => 
        ApiClient.deleteMessage(messageId)
      );
      
      await Promise.all(deletePromises);
      
      toast({
        title: "Messages deleted",
        description: `${selectedMessages.size} message(s) have been deleted successfully`
      });
      
      // Clear selection and refresh
      setSelectedMessages(new Set());
      setIsSelectionMode(false);
      
      if (selectedContactId) {
        await fetchMessages(selectedContactId);
        await fetchContacts();
      }
      
    } catch (err) {
      console.error("[MessagingInterface] handleBulkDelete: Exception", err);
      toast({
        variant: "destructive",
        title: "Failed to delete messages",
        description: "Some messages may not have been deleted. Please try again."
      });
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMessages(new Set());
  };

  // Toggle message selection
  const toggleMessageSelection = (messageId: number) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  // Toggle summarization selection mode
  const toggleSummarizationSelectionMode = () => {
    setIsSummarizationSelectionMode(!isSummarizationSelectionMode);
    setSelectedForSummarization(new Set());
  };

  // Toggle message selection for summarization
  const toggleSummarizationSelection = (messageId: number) => {
    console.log("[MessagingInterface] toggleSummarizationSelection: Toggling message", messageId);
    console.log("[MessagingInterface] toggleSummarizationSelection: Current selectedForSummarization", Array.from(selectedForSummarization));
    
    const newSelected = new Set(selectedForSummarization);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
      console.log("[MessagingInterface] toggleSummarizationSelection: Removed message", messageId);
    } else {
      newSelected.add(messageId);
      console.log("[MessagingInterface] toggleSummarizationSelection: Added message", messageId);
    }
    
    console.log("[MessagingInterface] toggleSummarizationSelection: New selectedForSummarization", Array.from(newSelected));
    setSelectedForSummarization(newSelected);
  };

  // Handle conversation summarization
  const handleSummarizeConversation = async () => {
    if (!selectedContactId) return;

    setIsSummarizing(true);
    setError(null);

    console.log("[MessagingInterface] handleSummarizeConversation: Starting summarization", {
      selectedContactId,
      selectedForSummarization: Array.from(selectedForSummarization),
      isSummarizationSelectionMode,
    });

    try {
      let messageIds: number[] | undefined;

      // If in summarization selection mode and messages are selected, use those
      if (isSummarizationSelectionMode && selectedForSummarization.size > 0) {
        messageIds = Array.from(selectedForSummarization);
        console.log("[MessagingInterface] handleSummarizeConversation: Using selected messages", messageIds);
      } else if (isSummarizationSelectionMode && selectedForSummarization.size === 0) {
        // If in selection mode but no messages selected, show error
        toast({
          variant: "destructive",
          title: "No messages selected",
          description: "Please select messages to summarize or exit selection mode to summarize all messages"
        });
        setIsSummarizing(false);
        return;
      } else {
        // Not in selection mode, summarize all messages
        messageIds = undefined;
        console.log("[MessagingInterface] handleSummarizeConversation: Summarizing all messages");
      }

      const response = await ApiClient.summarizeConversation(selectedContactId, messageIds);
      console.log("[MessagingInterface] handleSummarizeConversation: Response", response);

      if (response.success && response.data) {
        setConversationSummary(response.data);
        setShowSummaryModal(true);
        
        // Exit summarization selection mode after successful summarization
        if (isSummarizationSelectionMode) {
          setIsSummarizationSelectionMode(false);
          setSelectedForSummarization(new Set());
        }
      } else {
        setError(response.error || "Failed to generate summary");
        toast({
          variant: "destructive",
          title: "Summarization failed",
          description: response.error || "Could not generate conversation summary"
        });
        console.error("[MessagingInterface] handleSummarizeConversation: Error", response.error);
      }
    } catch (err) {
      setError("Exception in handleSummarizeConversation");
      console.error("[MessagingInterface] handleSummarizeConversation: Exception", err);
    }

    setIsSummarizing(false);
  };

  // Handle creating store schedule from summary
  const handleCreateStoreSchedule = async () => {
    if (!conversationSummary || !selectedContactId) {
      console.log("[MessagingInterface] handleCreateStoreSchedule: Missing required data", { conversationSummary: !!conversationSummary, selectedContactId });
      return;
    }

    console.log("[MessagingInterface] handleCreateStoreSchedule: Creating schedule with extracted data", conversationSummary.extractedData);
    
    try {
      // Get contact information for employee name
      const contact = contacts.find(c => c.id === selectedContactId);
      if (!contact) {
        console.error("[MessagingInterface] handleCreateStoreSchedule: Contact not found", { selectedContactId, contactsCount: contacts.length });
        toast({
          variant: "destructive",
          title: "Contact not found",
          description: "The selected contact could not be found. Please try refreshing the page."
        });
        return;
      }
      const employeeName = contact.name;
      
      // Use extracted data
      const extractedData = conversationSummary.extractedData || {
        employeeName: '',
        storeNumber: '',
        storeLocation: '',
        shiftDate: '',
        shiftTime: '',
        availability: '',
        constraints: ''
      };
      
      // Auto-select store based on extracted data, with fallback to selected store
      let storeNumber = selectedStoreNumber; // Default to manually selected store
      let autoSelected = false;
      
      console.log("[MessagingInterface] handleCreateStoreSchedule: Store selection", {
        extractedStoreNumber: extractedData.storeNumber,
        selectedStoreNumber,
        employeeName
      });
      
      if (extractedData.storeNumber) {
        const extractedStoreNumber = parseInt(extractedData.storeNumber);
        console.log("[MessagingInterface] handleCreateStoreSchedule: Parsed extracted store number", extractedStoreNumber);
        
        if (!isNaN(extractedStoreNumber)) {
          if (extractedStoreNumber >= 1 && extractedStoreNumber <= 50) {
            storeNumber = extractedStoreNumber;
            autoSelected = true;
            console.log("[MessagingInterface] handleCreateStoreSchedule: Auto-selected store number", storeNumber);
          } else {
            // Store number is outside valid range, keep manually selected store
            console.log("[MessagingInterface] handleCreateStoreSchedule: Store number outside valid range, using manually selected store", selectedStoreNumber);
            toast({
              variant: "destructive",
              title: "Invalid Store Number",
              description: `Extracted store #${extractedStoreNumber} is outside valid range (1-50). Using manually selected store #${selectedStoreNumber}.`
            });
          }
        }
      }
      
      console.log("[MessagingInterface] handleCreateStoreSchedule: Final store number", storeNumber, "Auto-selected:", autoSelected);
      
      const shiftTime = extractedData.shiftTime || "TBD";
      
      // Determine the date to use
      let scheduleDate = new Date().toISOString().split('T')[0]; // Default to today
      if (extractedData.shiftDate) {
        // Try to parse the extracted date
        const parsedDate = new Date(extractedData.shiftDate);
        if (!isNaN(parsedDate.getTime())) {
          scheduleDate = parsedDate.toISOString().split('T')[0];
        }
      }

      const scheduleData = {
        store_number: storeNumber,
        date: scheduleDate,
        employee_name: employeeName,
        shift_time: shiftTime,
        notes: `AI Extracted Data:
Employee: ${employeeName}
Store: ${extractedData.storeLocation || `Store #${storeNumber}`}
Date: ${scheduleDate}
Time: ${shiftTime}
Availability: ${extractedData.availability || 'Not specified'}
Constraints: ${extractedData.constraints || 'None'}

Summary: ${conversationSummary.summary}

Key Points:
${conversationSummary.keyPoints.join('\n')}

Action Items:
${conversationSummary.actionItems.join('\n')}`,
      };

      const response = await ApiClient.createStoreSchedule(scheduleData);
      console.log("[MessagingInterface] handleCreateStoreSchedule: Response", response);

      if (response.success) {
        const storeSelectionText = autoSelected ? `Auto-assigned to Store #${storeNumber}` : `Assigned to Store #${storeNumber}`;
        toast({
          title: "Scheduling note created",
          description: `${storeSelectionText} for ${employeeName} on ${scheduleDate}`
        });
        setShowSummaryModal(false);
        setSelectedStoreNumber(1);
        // Trigger refresh of store scheduling data
        onDataChange?.();
      } else {
        toast({
          variant: "destructive",
          title: "Failed to create store schedule",
          description: response.error || "Could not create store schedule"
        });
        console.error("[MessagingInterface] handleCreateStoreSchedule: Error", response.error);
      }
    } catch (err) {
      console.error("[MessagingInterface] handleCreateStoreSchedule: Exception", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create store schedule. Please try again."
      });
    }
  };

  // Handle adding summary to daily summary
  const handleAddToDailySummary = async () => {
    if (!conversationSummary || isAddingToDailySummary) return;

    console.log("[MessagingInterface] handleAddToDailySummary: Starting with conversationSummary", conversationSummary);
    
    setIsAddingToDailySummary(true);
    const today = new Date().toISOString().split('T')[0];
    
    console.log("[MessagingInterface] handleAddToDailySummary: Using date", today, "and conversationSummary", conversationSummary);

    try {
      // Get message IDs for the selected messages or all messages if not in selection mode
      let messageIds: number[] | undefined;
      if (isSummarizationSelectionMode && selectedForSummarization.size > 0) {
        messageIds = Array.from(selectedForSummarization);
      } else {
        messageIds = messages.map(m => m.id);
      }

      const response = await ApiClient.addConversationToDailySummary(today, conversationSummary, selectedContactId!, messageIds);
      console.log("[MessagingInterface] handleAddToDailySummary: Response", response);

      if (response.success) {
        toast({
          title: "Added to daily summary",
          description: "Conversation summary has been added to today's daily summary"
        });
        setShowSummaryModal(false);
        // Trigger refresh of dashboard data
        console.log('[MessagingInterface] handleAddToDailySummary: Calling onDataChange callback');
        onDataChange?.();
        console.log('[MessagingInterface] handleAddToDailySummary: onDataChange callback completed');
      } else {
        toast({
          variant: "destructive",
          title: "Failed to add to daily summary",
          description: response.error || "Could not add to daily summary"
        });
        console.error("[MessagingInterface] handleAddToDailySummary: Error", response.error);
      }
    } catch (err) {
      console.error("[MessagingInterface] handleAddToDailySummary: Exception", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add to daily summary. Please try again."
      });
    } finally {
      setIsAddingToDailySummary(false);
    }
  };

  // Memoize expensive operations
  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedContactId), 
    [contacts, selectedContactId]
  );
  
  // Clear selectedContactId if the contact doesn't exist
  if (selectedContactId && !selectedContact && contacts.length > 0) {
    console.warn("[MessagingInterface] selectedContact not found, clearing selectedContactId", { selectedContactId, contactsCount: contacts.length });
    setSelectedContactId(null);
  }

  const filteredContacts = useMemo(() => 
    contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
    ), 
    [contacts, searchTerm]
  );

  const getMessageStatus = (message: Message) => {
    if (message.direction === 'outbound') {
      // Show acknowledgment status if message requires acknowledgment
      if (message.requires_acknowledgment) {
        if (message.acknowledged_at) {
          return (
            <div className="flex items-center gap-1">
              <CheckCheck className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600">Acknowledged</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-amber-500">Awaiting ack</span>
            </div>
          );
        }
      }
      
      // Regular message status
      switch (message.status) {
        case 'read': return <CheckCheck className="w-3 h-3 text-success" />;
        case 'delivered': return <Check className="w-3 h-3 opacity-70" />;
        case 'sent': return <Check className="w-3 h-3 opacity-50" />;
        case 'failed': return <span className="text-xs text-destructive">Failed</span>;
        default: return <Clock className="w-3 h-3 opacity-50" />;
      }
    }
    return null;
  };

  // Always render the UI, even if no contact is selected
  // (activeTab check is still needed for tab logic)
  if (activeTab !== "messages") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Pharmacy Scheduling Messages
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage employee availability and shift scheduling via SMS
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90"
          onClick={() => {
            // Automatically select the first contact if available
            if (contacts.length > 0 && !selectedContactId) {
              setSelectedContactId(contacts[0].id!);
              toast({
                title: "Ready to message",
                description: `Selected ${contacts[0].name}. You can change the contact from the list on the left.`
              });
            } else if (contacts.length === 0) {
              toast({
                title: "No contacts",
                description: "Add a contact first from the Contacts tab, then return here to send messages."
              });
            } else {
              toast({
                title: "Ready to send",
                description: "Type your message in the text box below and click send."
              });
            }
          }}
        >
          <Send className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Main Chat Interface */}
      <Card className="bg-card border-border shadow-card h-[600px]">
        <div className="flex h-full">
          {/* Contact List */}
          <div className="w-80 border-r border-border">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            
            {isLoadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading contacts...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 px-4">
                <div className="text-destructive mb-2">Failed to load contacts</div>
                <Button onClick={fetchContacts} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-2 p-4 pt-0">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No contacts match your search" : "No contacts available"}
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                          selectedContactId === contact.id ? "bg-primary/10 border border-primary/20" : "bg-transparent"
                        }`}
                        onClick={() => setSelectedContactId(contact.id!)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {contact.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                              contact.status === "active" ? "bg-success" : "bg-muted"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-foreground truncate">
                                {contact.name}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {contact.lastMessageTime || "No messages"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {contact.lastMessage || "No conversation yet"}
                            </p>
                          </div>
                          {contact.unreadCount && contact.unreadCount > 0 && (
                            <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                              {contact.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {selectedContact.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {selectedContact.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedContact.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelectionMode && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {selectedMessages.size} selected
                        </Badge>
                      )}
                      {isSummarizationSelectionMode && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                          {selectedForSummarization.size} for summary
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={isSummarizationSelectionMode ? handleSummarizeConversation : toggleSummarizationSelectionMode}
                        disabled={isSummarizing || messages.length === 0}
                        className={`${isSummarizationSelectionMode ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'text-primary hover:text-primary/80'}`}
                      >
                        {isSummarizing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="ml-1 text-xs">
                          {isSummarizationSelectionMode 
                            ? selectedForSummarization.size > 0 
                              ? `Extract Schedule ${selectedForSummarization.size} (${Array.from(selectedForSummarization).join(',')})` 
                              : 'Extract Schedule'
                            : 'Select for Schedule'
                          }
                        </span>
                      </Button>
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          className="text-primary hover:text-primary/80" 
                          size="sm"
                          onClick={() => {
                            const dropdown = document.getElementById('message-options-dropdown');
                            if (dropdown) {
                              dropdown.classList.toggle('hidden');
                            }
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <div 
                          id="message-options-dropdown"
                          className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 hidden"
                        >
                          <div className="py-1">
                            <button
                              className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                              onClick={() => {
                                toggleSelectionMode();
                                document.getElementById('message-options-dropdown')?.classList.add('hidden');
                              }}
                            >
                              <FileText className="w-4 h-4" />
                              {isSelectionMode ? "Exit Selection Mode" : "Select Messages"}
                            </button>
                            {isSelectionMode && selectedMessages.size > 0 && (
                              <button
                                className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                                onClick={() => {
                                  handleBulkDelete();
                                  document.getElementById('message-options-dropdown')?.classList.add('hidden');
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected ({selectedMessages.size})
                              </button>
                            )}
                            {isSummarizationSelectionMode && (
                              <button
                                className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                                onClick={() => {
                                  toggleSummarizationSelectionMode();
                                  document.getElementById('message-options-dropdown')?.classList.add('hidden');
                                }}
                              >
                                <Sparkles className="w-4 h-4" />
                                Exit Summary Selection
                              </button>
                            )}
                            <div className="border-t border-border my-1"></div>
                            <button
                              className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 text-destructive"
                              onClick={() => {
                                handleDeleteConversation();
                                document.getElementById('message-options-dropdown')?.classList.add('hidden');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete All Messages
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 min-h-0 overflow-y-auto" style={{ minHeight: 0 }}>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading messages...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex group ${message.direction === 'outbound' ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                                message.direction === 'outbound'
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              } ${isSelectionMode && selectedMessages.has(message.id!) ? "ring-2 ring-primary ring-offset-2" : ""} ${isSummarizationSelectionMode && selectedForSummarization.has(message.id!) ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                              style={{ wordBreak: "break-word" }}
                            >
                              {isSelectionMode && (
                                <div className="absolute -left-2 -top-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedMessages.has(message.id!)}
                                    onChange={() => toggleMessageSelection(message.id!)}
                                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                  />
                                </div>
                              )}
                              {isSummarizationSelectionMode && (
                                <div 
                                  className="absolute -left-2 -top-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleSummarizationSelection(message.id!);
                                  }}
                                >
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    selectedForSummarization.has(message.id!) 
                                      ? 'bg-blue-500 border-blue-500' 
                                      : 'bg-background border-blue-500'
                                  }`}>
                                    {selectedForSummarization.has(message.id!) && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                </div>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs opacity-70">
                                  {message.created_at ? new Date(message.created_at).toLocaleTimeString() : ''}
                                </span>
                                <div className="flex items-center gap-1">
                                  {getMessageStatus(message)}
                                </div>
                              </div>
                              {message.ai_generated && (
                                <div className="text-xs opacity-60 mt-1 italic">
                                  AI-generated
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  {/* Acknowledgment Option */}
                  <div className="flex items-center space-x-2 mb-3">
                    <Switch 
                      id="require-acknowledgment"
                      checked={requiresAcknowledgment}
                      onCheckedChange={setRequiresAcknowledgment}
                    />
                    <Label htmlFor="require-acknowledgment" className="text-sm">
                      Require acknowledgment
                    </Label>
                    {requiresAcknowledgment && (
                      <Badge variant="secondary" className="text-xs">
                        Recipient must reply with code
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      className="flex-1 min-h-[40px] max-h-32 resize-none"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Select a contact to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent>
                      <DialogHeader>
              <DialogTitle>Pharmacy Scheduling Note</DialogTitle>
            </DialogHeader>
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Scheduling Summary:</h4>
            <p className="text-sm text-muted-foreground">{conversationSummary?.summary}</p>

            <h4 className="font-semibold text-lg">Employee Availability:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {conversationSummary?.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>

            <h4 className="font-semibold text-lg">Scheduling Actions:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {conversationSummary?.actionItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4 className="font-semibold text-lg">Priority Level:</h4>
            <p className="text-sm text-muted-foreground">{conversationSummary?.priority}</p>

            {/* Extracted Data Display */}
            {conversationSummary?.extractedData && (
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Extracted Information:</h4>
                  {conversationSummary.extractedData.confidence && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              conversationSummary.extractedData.confidence.overall >= 0.7 ? 'bg-green-500' :
                              conversationSummary.extractedData.confidence.overall >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${conversationSummary.extractedData.confidence.overall * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {Math.round(conversationSummary.extractedData.confidence.overall * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Employee:</span>
                    <p className="text-muted-foreground">
                      {contacts.find(c => c.id === selectedContactId)?.name || 'Unknown Employee'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Store:</span>
                      {conversationSummary.extractedData.confidence && (
                        <span className={`text-xs px-1 rounded ${
                          conversationSummary.extractedData.confidence.storeNumber >= 0.7 ? 'bg-green-100 text-green-700' :
                          conversationSummary.extractedData.confidence.storeNumber >= 0.4 ? 'bg-yellow-100 text-yellow-700' : 
                          conversationSummary.extractedData.confidence.storeNumber > 0 ? 'bg-red-100 text-red-700' : ''
                        }`}>
                          {conversationSummary.extractedData.confidence.storeNumber > 0 ? `${Math.round(conversationSummary.extractedData.confidence.storeNumber * 100)}%` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{conversationSummary.extractedData.storeLocation || `Store #${conversationSummary.extractedData.storeNumber}` || 'Not specified'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Date:</span>
                      {conversationSummary.extractedData.confidence && (
                        <span className={`text-xs px-1 rounded ${
                          conversationSummary.extractedData.confidence.shiftDate >= 0.7 ? 'bg-green-100 text-green-700' :
                          conversationSummary.extractedData.confidence.shiftDate >= 0.4 ? 'bg-yellow-100 text-yellow-700' : 
                          conversationSummary.extractedData.confidence.shiftDate > 0 ? 'bg-red-100 text-red-700' : ''
                        }`}>
                          {conversationSummary.extractedData.confidence.shiftDate > 0 ? `${Math.round(conversationSummary.extractedData.confidence.shiftDate * 100)}%` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{conversationSummary.extractedData.shiftDate || 'Not specified'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Time:</span>
                      {conversationSummary.extractedData.confidence && (
                        <span className={`text-xs px-1 rounded ${
                          conversationSummary.extractedData.confidence.shiftTime >= 0.7 ? 'bg-green-100 text-green-700' :
                          conversationSummary.extractedData.confidence.shiftTime >= 0.4 ? 'bg-yellow-100 text-yellow-700' : 
                          conversationSummary.extractedData.confidence.shiftTime > 0 ? 'bg-red-100 text-red-700' : ''
                        }`}>
                          {conversationSummary.extractedData.confidence.shiftTime > 0 ? `${Math.round(conversationSummary.extractedData.confidence.shiftTime * 100)}%` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{conversationSummary.extractedData.shiftTime || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Availability:</span>
                    <p className="text-muted-foreground">{conversationSummary.extractedData.availability || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Constraints:</span>
                    <p className="text-muted-foreground">{conversationSummary.extractedData.constraints || 'None'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Store Selection */}
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Store Assignment:</h4>
              {conversationSummary?.extractedData?.storeNumber && 
               parseInt(conversationSummary.extractedData.storeNumber) >= 1 && 
               parseInt(conversationSummary.extractedData.storeNumber) <= 50 ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Auto-selected:</strong> Store #{conversationSummary.extractedData.storeNumber}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Based on conversation content. You can manually change below if needed.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Manual selection required:</strong> No valid store number found in conversation.
                  </p>
                </div>
              )}
              <Select 
                value={selectedStoreNumber.toString()} 
                onValueChange={(value) => setSelectedStoreNumber(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(storeNumber => (
                    <SelectItem key={storeNumber} value={storeNumber.toString()}>
                      Store #{storeNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateStoreSchedule}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Store className="w-4 h-4 mr-2" />
                Create Scheduling Note
              </Button>
              
              <Button
                onClick={handleAddToDailySummary}
                disabled={isAddingToDailySummary}
                className="bg-primary hover:bg-primary/90"
              >
                {isAddingToDailySummary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Add to Daily Summary
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});