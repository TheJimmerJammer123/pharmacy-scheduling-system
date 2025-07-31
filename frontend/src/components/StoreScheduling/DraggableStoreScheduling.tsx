import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { Calendar, Store, ArrowLeft, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useStoreScheduling } from "@/hooks/useStoreScheduling";
import { DraggablePanel } from "./DraggablePanel";
import { CalendarPanel } from "./CalendarPanel";
import { StoreInfoPanel } from "./StoreInfoPanel";
import { GeneralNotesPanel } from "./GeneralNotesPanel";

interface DraggableStoreSchedulingProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface PanelState {
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
}

export const DraggableStoreScheduling = memo(({ activeTab, setActiveTab }: DraggableStoreSchedulingProps) => {
  // Use the custom hook for all business logic
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

  // Panel visibility and state management
  const [panelStates, setPanelStates] = useState<Record<string, PanelState>>({
    calendar: { isVisible: true, isMinimized: false, isMaximized: false },
    storeInfo: { isVisible: true, isMinimized: false, isMaximized: false },
    generalNotes: { isVisible: true, isMinimized: false, isMaximized: false },
  });

  // Generate store numbers from actual stores
  const storeNumbers = useMemo(() => {
    if (stores.length === 0) {
      return [1, 2, 3, 4, 5]; // Fallback while loading
    }
    return stores.map(store => store.store_number).sort((a, b) => a - b);
  }, [stores]);

  // Check if date has schedules for the selected store
  const hasSchedules = (date: Date) => {
    return getSchedulesForStoreAndDate(selectedStore, date).length > 0;
  };

  // Panel control functions
  const togglePanel = useCallback((panelId: string) => {
    setPanelStates(prev => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        isVisible: !prev[panelId].isVisible,
      },
    }));
  }, []);

  const toggleMinimize = useCallback((panelId: string) => {
    setPanelStates(prev => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        isMinimized: !prev[panelId].isMinimized,
        isMaximized: false,
      },
    }));
  }, []);

  const toggleMaximize = useCallback((panelId: string) => {
    setPanelStates(prev => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        isMaximized: !prev[panelId].isMaximized,
        isMinimized: false,
      },
    }));
  }, []);

  const closePanel = useCallback((panelId: string) => {
    setPanelStates(prev => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        isVisible: false,
      },
    }));
  }, []);

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
    <div className="h-full relative bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
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

          {/* Panel Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Show all panels
                setPanelStates({
                  calendar: { isVisible: true, isMinimized: false, isMaximized: false },
                  storeInfo: { isVisible: true, isMinimized: false, isMaximized: false },
                  generalNotes: { isVisible: true, isMinimized: false, isMaximized: false },
                });
              }}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Reset Layout
            </Button>
          </div>
        </div>
      </div>

      {/* Draggable Panels */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Calendar Panel */}
        {panelStates.calendar.isVisible && (
          <DraggablePanel
            id="calendar"
            title="Calendar"
            icon={<Calendar className="w-4 h-4 text-primary" />}
            defaultPosition={{ x: 20, y: 20 }}
            defaultSize={{ width: 400, height: 350 }}
            minSize={{ width: 300, height: 250 }}
            maxSize={{ width: 600, height: 500 }}
            isMinimized={panelStates.calendar.isMinimized}
            isMaximized={panelStates.calendar.isMaximized}
            onClose={() => closePanel('calendar')}
            onMinimize={() => toggleMinimize('calendar')}
            onMaximize={() => toggleMaximize('calendar')}
          >
            <CalendarPanel
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              hasSchedules={hasSchedules}
            />
          </DraggablePanel>
        )}

        {/* Store Information Panel */}
        {panelStates.storeInfo.isVisible && (
          <DraggablePanel
            id="storeInfo"
            title="Store Information"
            icon={<Store className="w-4 h-4 text-primary" />}
            defaultPosition={{ x: 440, y: 20 }}
            defaultSize={{ width: 350, height: 400 }}
            minSize={{ width: 300, height: 300 }}
            maxSize={{ width: 500, height: 600 }}
            isMinimized={panelStates.storeInfo.isMinimized}
            isMaximized={panelStates.storeInfo.isMaximized}
            onClose={() => closePanel('storeInfo')}
            onMinimize={() => toggleMinimize('storeInfo')}
            onMaximize={() => toggleMaximize('storeInfo')}
          >
            <StoreInfoPanel
              store={getCurrentStore}
              selectedStore={selectedStore}
            />
          </DraggablePanel>
        )}

        {/* General Notes Panel */}
        {panelStates.generalNotes.isVisible && (
          <DraggablePanel
            id="generalNotes"
            title="Schedules & Notes"
            icon={<Store className="w-4 h-4 text-primary" />}
            defaultPosition={{ x: 20, y: 390 }}
            defaultSize={{ width: 770, height: 400 }}
            minSize={{ width: 400, height: 300 }}
            maxSize={{ width: 1000, height: 600 }}
            isMinimized={panelStates.generalNotes.isMinimized}
            isMaximized={panelStates.generalNotes.isMaximized}
            onClose={() => closePanel('generalNotes')}
            onMinimize={() => toggleMinimize('generalNotes')}
            onMaximize={() => toggleMaximize('generalNotes')}
          >
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
          </DraggablePanel>
        )}

        {/* Panel Toggle Buttons (when panels are hidden) */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {!panelStates.calendar.isVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => togglePanel('calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Show Calendar
            </Button>
          )}
          {!panelStates.storeInfo.isVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => togglePanel('storeInfo')}
              className="flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              Show Store Info
            </Button>
          )}
          {!panelStates.generalNotes.isVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => togglePanel('generalNotes')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Show Schedules
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}); 