import React, { useState, useEffect, memo } from "react";
import { Calendar, User, ArrowLeft, MapPin, Clock, FileText, Edit3, Save, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ApiClient } from "@/lib/supabase-api";
import { useToast } from "@/hooks/use-toast";

interface EmployeeSchedulingProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface EmployeeSchedule {
  id: number;
  store_number: number;
  store_name: string;
  store_address: string;
  date: string;
  employee_name: string;
  shift_time: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const EmployeeScheduling = memo(({ activeTab, setActiveTab }: EmployeeSchedulingProps) => {
  const [employees, setEmployees] = useState<Array<{ employee_name: string }>>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>([]);
  const [employeeNotes, setEmployeeNotes] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 1)); // Start with July 2025 where we have data

  const { toast } = useToast();

  // Load employees when component becomes active
  useEffect(() => {
    if (activeTab === 'employee-scheduling') {
      loadEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load employee schedules when employee is selected or date changes
  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeSchedules();
      loadEmployeeNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, currentDate]);

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await ApiClient.getAllEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
        if (response.data.length > 0 && !selectedEmployee) {
          setSelectedEmployee(response.data[0].employee_name);
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees list",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const loadEmployeeSchedules = async () => {
    if (!selectedEmployee) return;
    
    setIsLoadingSchedules(true);
    try {
      // Load schedules for the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const response = await ApiClient.getEmployeeSchedules(selectedEmployee, startDate, endDate);
      if (response.success && response.data) {
        setEmployeeSchedules(response.data);
      }
    } catch (error) {
      console.error('Failed to load employee schedules:', error);
      setEmployeeSchedules([]);
      toast({
        title: "Error",
        description: "Failed to load employee schedules",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const loadEmployeeNotes = async () => {
    if (!selectedEmployee) return;
    
    try {
      const response = await ApiClient.getEmployeeNotes(selectedEmployee);
      if (response.success && response.data && response.data.length > 0) {
        setEmployeeNotes(response.data[0].notes || '');
      } else {
        setEmployeeNotes('');
      }
    } catch (error) {
      console.error('Failed to load employee notes:', error);
      setEmployeeNotes('');
    }
  };

  const handleEmployeeChange = (employeeName: string) => {
    setSelectedEmployee(employeeName);
  };

  const handleEditNotes = () => {
    setIsEditingNotes(true);
    setEditedNotes(employeeNotes);
  };

  const handleSaveNotes = async () => {
    if (!selectedEmployee) return;

    setIsSavingNotes(true);
    try {
      const response = await ApiClient.saveEmployeeNotes(selectedEmployee, editedNotes);
      if (response.success) {
        setEmployeeNotes(editedNotes);
        setIsEditingNotes(false);
        toast({
          title: "Success",
          description: "Employee notes saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to save employee notes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save employee notes:', error);
      toast({
        title: "Error",
        description: "Failed to save employee notes",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelEditNotes = () => {
    setIsEditingNotes(false);
    setEditedNotes('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === 'TBD') return timeString;
    // Handle various time formats
    return timeString;
  };

  // Group schedules by date
  const schedulesByDate = employeeSchedules.reduce((acc, schedule) => {
    const date = schedule.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, EmployeeSchedule[]>);

  const sortedDates = Object.keys(schedulesByDate).sort();

  // Month navigation
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const currentMonthName = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (activeTab !== 'employee-scheduling') return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50 shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">Employee Scheduling</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Employee Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Employee:</span>
            {isLoadingEmployees ? (
              <div className="w-48 h-9 bg-muted animate-pulse rounded-md" />
            ) : (
              <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.employee_name} value={employee.employee_name}>
                      {employee.employee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedEmployee && (
              <Badge variant="secondary" className="ml-2">
                {employeeSchedules.length} shifts this month
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {!selectedEmployee ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Select an Employee
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose an employee from the dropdown to view their schedule and notes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Employee Schedule */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Schedule for {selectedEmployee}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMonthChange('prev')}
                    >
                      ←
                    </Button>
                    <span className="text-sm font-medium px-3">
                      {currentMonthName}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMonthChange('next')}
                    >
                      →
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSchedules ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : employeeSchedules.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No schedules found for {selectedEmployee} in {currentMonthName}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedDates.map(date => (
                        <div key={date} className="border rounded-lg p-4">
                          <h4 className="font-medium text-sm text-muted-foreground mb-3">
                            {formatDate(date)}
                          </h4>
                          <div className="space-y-2">
                            {schedulesByDate[date].map(schedule => (
                              <div
                                key={schedule.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      Store #{schedule.store_number} - {schedule.store_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(schedule.shift_time)}</span>
                                  </div>
                                  {schedule.notes && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {schedule.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Employee Notes */}
            <div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Employee Notes
                  </CardTitle>
                  {!isEditingNotes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditNotes}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditingNotes ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Add notes about this employee..."
                        className="min-h-[200px]"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                          size="sm"
                        >
                          {isSavingNotes ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted border-t-primary mr-1" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEditNotes}
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[200px]">
                      {employeeNotes ? (
                        <div className="whitespace-pre-wrap text-sm">
                          {employeeNotes}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No notes for {selectedEmployee}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditNotes}
                            className="mt-2"
                          >
                            Add Notes
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});