import React, { useState, useCallback, useMemo, memo } from "react";
import { Calendar, Store, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useStoreScheduling } from "@/hooks/useStoreScheduling";
import { CalendarPanel } from "./CalendarPanel";
import { StoreInfoPanel } from "./StoreInfoPanel";
import { GeneralNotesPanel } from "./GeneralNotesPanel";

interface ImprovedStoreSchedulingProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}


export const ImprovedStoreScheduling = memo(({ activeTab, setActiveTab }: ImprovedStoreSchedulingProps) => {
  const {
    stores,
    isLoading,
    currentDate,
    selectedStore,
    selectedDate,
    schedulesForSelectedDate,
    isCreating,
    isEditing,
    editedContent,
    isSaving,
    generalNotes,
    isEditingSchedule,
    editingSchedule,
    scheduleForm,
    getCurrentStore,
    getSchedulesForStoreAndDate,
    setCurrentDate,
    setIsCreating,
    setIsEditing,
    setEditedContent,
    setScheduleForm,
    handleDateSelect,
    handleSaveGeneralNotes,
    handleCreateSchedule,
    handleUpdateSchedule,
    handleDeleteSchedule,
    resetScheduleForm,
    startEditingSchedule,
    handleStoreChange,
  } = useStoreScheduling(activeTab);

  // Generate store numbers
  const storeNumbers = useMemo(() => {
    if (stores.length === 0) {
      return [1, 2, 3, 4, 5];
    }
    return stores.map(store => store.store_number).sort((a, b) => a - b);
  }, [stores]);

  // Check if date has schedules
  const hasSchedules = (date: Date) => {
    return getSchedulesForStoreAndDate(selectedStore, date).length > 0;
  };

  // Schedule form handlers
  const handleAddSchedule = useCallback(() => {
    setIsCreating(true);
    resetScheduleForm();
  }, [setIsCreating, resetScheduleForm]);

  const handleSubmitScheduleForm = useCallback(() => {
    if (isCreating) {
      handleCreateSchedule();
    } else if (isEditingSchedule) {
      handleUpdateSchedule();
    }
  }, [isCreating, isEditingSchedule, handleCreateSchedule, handleUpdateSchedule]);

  const handleCancelScheduleForm = useCallback(() => {
    setIsCreating(false);
    setIsEditing(false);
    resetScheduleForm();
  }, [setIsCreating, setIsEditing, resetScheduleForm]);

  const handleStartGeneralNotesEditing = useCallback(() => {
    setIsEditing(true);
    setEditedContent(generalNotes || '');
  }, [setIsEditing, setEditedContent, generalNotes]);

  const handleCancelGeneralNotesEditing = useCallback(() => {
    setIsEditing(false);
    setEditedContent('');
  }, [setIsEditing, setEditedContent]);

  // Month navigation
  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, setCurrentDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading store scheduling...</p>
        </div>
      </div>
    );
  }

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
            <Store className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">Store Scheduling</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Store Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Store:</span>
            <Select value={selectedStore.toString()} onValueChange={(value) => handleStoreChange(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {storeNumbers.map(storeNumber => (
                  <SelectItem key={storeNumber} value={storeNumber.toString()}>
                    #{storeNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* Resizable Layout */}
      <div className="flex-1 min-h-[600px]">
        <ResizablePanelGroup direction="horizontal" className="min-h-full">
          {/* Calendar Panel */}
          <ResizablePanel defaultSize={25} minSize={15} id="calendar-panel">
            <Card className="min-h-[300px] h-full rounded-none border-0 border-r">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <CalendarPanel
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onMonthChange={handleMonthChange}
                  hasSchedules={hasSchedules}
                />
              </CardContent>
            </Card>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Store Info Panel */}
          <ResizablePanel defaultSize={25} minSize={15} id="store-info-panel">
            <Card className="min-h-[300px] h-full rounded-none border-0 border-r">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Store className="w-4 h-4 text-primary" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <StoreInfoPanel
                  store={getCurrentStore}
                  selectedStore={selectedStore}
                />
              </CardContent>
            </Card>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Schedules Panel */}
          <ResizablePanel defaultSize={50} minSize={30} id="schedules-panel">
            <Card className="min-h-[400px] h-full rounded-none border-0">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Store className="w-4 h-4 text-primary" />
                  Schedules & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <GeneralNotesPanel
                  selectedStore={selectedStore}
                  selectedDate={selectedDate}
                  schedulesForSelectedDate={schedulesForSelectedDate}
                  isCreating={isCreating}
                  isEditingSchedule={isEditingSchedule}
                  isSaving={isSaving}
                  scheduleForm={scheduleForm}
                  generalNotes={generalNotes}
                  isEditing={isEditing}
                  editedContent={editedContent}
                  getCurrentStore={getCurrentStore}
                  onAddSchedule={handleAddSchedule}
                  onEditSchedule={startEditingSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onStartGeneralNotesEditing={handleStartGeneralNotesEditing}
                  onSaveGeneralNotes={handleSaveGeneralNotes}
                  onCancelGeneralNotesEditing={handleCancelGeneralNotesEditing}
                  onContentChange={setEditedContent}
                  setScheduleForm={setScheduleForm}
                  onSubmitScheduleForm={handleSubmitScheduleForm}
                  onCancelScheduleForm={handleCancelScheduleForm}
                />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
});