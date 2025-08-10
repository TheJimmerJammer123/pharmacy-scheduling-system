import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MessageSquare, Edit, Trash2, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiService, Contact } from "@/services/apiService";

interface CreateContactRequest {
  name: string;
  phone: string;
  email?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

interface ContactManagementProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ContactManagement = ({ activeTab, setActiveTab }: ContactManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Logging state on render ---
  console.log("[ContactManagement] Render", {
    activeTab,
    selectedContact,
    filterStatus,
    searchTerm,
  });

  // Form data for new contact
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query parameters
  const queryParams: any = {};
  if (filterStatus !== "all") queryParams.status = filterStatus;
  if (searchTerm.trim()) queryParams.search = searchTerm.trim();

  // Use React Query for contacts
  const {
    data: contactsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['contacts', queryParams],
    queryFn: async () => {
      const contacts = await apiService.getContacts();
      if (!contacts) {
        throw new Error('Failed to fetch contacts');
      }
      // Apply filtering locally since backend doesn't support query params yet
      let filteredContacts = contacts;
      
      if (queryParams.status && queryParams.status !== 'all') {
        filteredContacts = filteredContacts.filter(c => c.status === queryParams.status);
      }
      
      if (queryParams.search) {
        const searchLower = queryParams.search.toLowerCase();
        filteredContacts = filteredContacts.filter(c => 
          c.name.toLowerCase().includes(searchLower) || 
          c.phone.includes(queryParams.search) ||
          (c.email && c.email.toLowerCase().includes(searchLower))
        );
      }
      
      return { success: true, data: filteredContacts };
    },
    enabled: activeTab === "contacts",
    retry: 3,
    retryDelay: 1000,
  });

  const contacts = contactsResponse?.data || [];

  // Mutations for CRUD operations
  const createContactMutation = useMutation({
    mutationFn: async (contactData: CreateContactRequest) => {
      const contact = await apiService.createContact(contactData);
      if (!contact) {
        throw new Error('Failed to create contact');
      }
      return { success: true, data: contact };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Success",
        description: "Contact created successfully"
      });
      setIsDialogOpen(false);
      setSelectedContact(null);
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        priority: "medium",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create contact"
      });
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      const contact = await apiService.updateContact(id.toString(), data);
      if (!contact) {
        throw new Error('Failed to update contact');
      }
      return { success: true, data: contact };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Success",
        description: "Contact updated successfully"
      });
      setIsDialogOpen(false);
      setSelectedContact(null);
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        priority: "medium",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update contact"
      });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const success = await apiService.deleteContact(id.toString());
      if (!success) {
        throw new Error('Failed to delete contact');
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Success",
        description: "Contact deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete contact"
      });
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const contactData: CreateContactRequest = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone,
      email: formData.email || undefined,
      priority: formData.priority,
      notes: formData.notes || undefined
    };

    console.log("[ContactManagement] handleSubmit:", selectedContact ? "Updating contact" : "Creating contact", contactData);

    try {
      if (selectedContact && selectedContact.id) {
        // Update existing contact
        await updateContactMutation.mutateAsync({ id: selectedContact.id, data: contactData });
      } else {
        // Create new contact
        await createContactMutation.mutateAsync(contactData);
      }
    } catch (err) {
      console.error("[ContactManagement] handleSubmit: Exception", err);
    }

    setIsSubmitting(false);
  };

  // Handle delete contact
  const handleDelete = async (contact: Contact) => {
    if (!contact.id) return;

    if (!confirm(`Are you sure you want to delete ${contact.name}?`)) return;

    console.log("[ContactManagement] handleDelete: Deleting contact", contact);

    try {
      await deleteContactMutation.mutateAsync(contact.id);
    } catch (err) {
      console.error("[ContactManagement] handleDelete: Exception", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-warning/10 text-warning border-warning/20";
      case "low": return "bg-muted text-muted-foreground border-muted";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success border-success/20";
      case "inactive": return "bg-muted text-muted-foreground border-muted";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  // Always render the UI, even if not on contacts tab (tab logic preserved)
  if (activeTab !== "contacts") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Contacts
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your client database and contact information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // Reset form and selected contact when dialog is closed
            setSelectedContact(null);
            setFormData({
              firstName: "",
              lastName: "",
              phone: "",
              email: "",
              priority: "medium",
              notes: ""
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Smith" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="+1 (555) 123-4567" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john.smith@email.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: "low" | "medium" | "high") => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input 
                  id="notes" 
                  placeholder="Additional notes..." 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {selectedContact ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-destructive">Error Loading Contacts</h3>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Failed to load contacts"}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading contacts...</span>
        </div>
      )}

      {/* Contacts List */}
      {!isLoading && !error && (
        <div className="grid gap-4">
          {contacts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                  <p className="mb-4">
                    {searchTerm || filterStatus !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Get started by adding your first contact"
                    }
                  </p>
                  {!searchTerm && filterStatus === "all" && (
                    <Button 
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        {contact.email && (
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getPriorityColor(contact.priority)}>
                        {contact.priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(contact.status)}>
                        {contact.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContact(contact);
                            const [firstName, ...lastNameParts] = contact.name.split(' ');
                            setFormData({
                              firstName: firstName || "",
                              lastName: lastNameParts.join(' ') || "",
                              phone: contact.phone,
                              email: contact.email || "",
                              priority: contact.priority,
                              notes: contact.notes || ""
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {contact.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">{contact.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};