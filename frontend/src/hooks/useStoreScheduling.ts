import { useState, useEffect, useCallback, useMemo } from "react";
import apiService from "@/services/apiService";
import { validateStoreSchedule } from "@/lib/validation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Store, StoreSchedule, ScheduleFormData } from "@/types/store";

// Utility to ensure date is in YYYY-MM-DD format
function toDateOnlyString(date: string) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export const useStoreScheduling = (activeTab: string) => {
  const [schedules, setSchedules] = useState<StoreSchedule[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 1)); // July 2025
  const [selectedStore, setSelectedStore] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedulesForSelectedDate, setSchedulesForSelectedDate] = useState<StoreSchedule[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [generalNotes, setGeneralNotes] = useState<string>("");
  
  // Pharmacist schedule management
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StoreSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormData>({
    employee_name: "",
    employee_id: "",
    role: "Pharmacist",
    employee_type: "Full Time",
    scheduled_hours: 8,
    shift_time: "",
    notes: ""
  });

  const { handleError, handleValidationError, handleSuccess } = useErrorHandler();

  // Get current selected store info (memoized)
  const getCurrentStore = useMemo(() => {
    return stores.find(store => store.store_number === selectedStore);
  }, [stores, selectedStore]);

  // Get schedules for a specific store and date (memoized)
  const getSchedulesForStoreAndDate = useCallback((storeNumber: number, date: Date) => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return schedules.filter(schedule => {
      // Handle both ISO date strings and date-only strings
      const scheduleDate = schedule.date.includes('T') 
        ? schedule.date.split('T')[0] 
        : schedule.date;
      return schedule.store_number === storeNumber && scheduleDate === dateString;
    });
  }, [schedules]);

  // Fetch all stores
  const fetchStores = useCallback(async () => {
    try {
      const data = await apiService.getStores();
      setStores(data || []);
      if (data && data.length > 0) {
        setSelectedStore(data[0].store_number);
      }
    } catch (error) {
      handleError(error, "fetchStores");
    }
  }, [handleError]);

  // Fetch schedules for the selected store and current month
  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      // Compute month range in local time to avoid TZ drift
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const dateFrom = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(monthStart.getDate()).padStart(2, '0')}`;
      const dateTo = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

      const data = await apiService.getAllStoreSchedules({
        store_number: selectedStore,
        date_from: dateFrom,
        date_to: dateTo,
      });

      setSchedules(data || []);
    } catch (error) {
      handleError(error, "fetchSchedules");
    } finally {
      setIsLoading(false);
    }
  }, [handleError, selectedStore, currentDate]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setSelectedDate(dateString);
    
    const storeSchedules = getSchedulesForStoreAndDate(selectedStore, date);
    setSchedulesForSelectedDate(storeSchedules);
    
    // Load general notes for this date (placeholder - would need API endpoint)
    setGeneralNotes("");
    setIsEditing(false);
    setEditedContent("");
  };

  // Handle saving general notes
  const handleSaveGeneralNotes = async () => {
    if (!selectedDate || !editedContent.trim()) {
      handleValidationError(["Please enter content for the general notes"]);
      return;
    }

    setIsSaving(true);
    try {
      // This would need a new API endpoint for general notes
      // For now, we'll just update the local state
      setGeneralNotes(editedContent);
      setIsEditing(false);
      handleSuccess(`General notes saved for Store #${selectedStore} on ${selectedDate}`);
    } catch (error) {
      handleError(error, "saveGeneralNotes");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle creating a new pharmacist schedule
  const handleCreateSchedule = async () => {
    const validationResult = validateStoreSchedule({
      store_number: selectedStore,
      date: selectedDate,
      employee_name: scheduleForm.employee_name,
      shift_time: scheduleForm.shift_time,
      notes: scheduleForm.notes,
    });
    
    if (!validationResult.isValid) {
      handleValidationError(validationResult.errors);
      return;
    }

    setIsSaving(true);
    try {
      const created = await apiService.createStoreSchedule({
        store_number: selectedStore,
        date: toDateOnlyString(selectedDate!),
        employee_name: scheduleForm.employee_name,
        employee_id: scheduleForm.employee_id || undefined,
        role: scheduleForm.role,
        employee_type: scheduleForm.employee_type,
        scheduled_hours: scheduleForm.scheduled_hours,
        shift_time: scheduleForm.shift_time,
        notes: scheduleForm.notes,
      });
      await fetchSchedules();
      resetScheduleForm();
      setIsCreating(false);
      handleSuccess(`Pharmacist schedule created for Store #${selectedStore}`);
    } catch (error) {
      handleError(error, "createSchedule");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating a pharmacist schedule
  const handleUpdateSchedule = async () => {
    const validationResult = validateStoreSchedule({
      store_number: editingSchedule!.store_number,
      date: editingSchedule!.date,
      employee_name: scheduleForm.employee_name,
      shift_time: scheduleForm.shift_time,
      notes: scheduleForm.notes,
    });
    
    if (!validationResult.isValid) {
      handleValidationError(validationResult.errors);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await apiService.updateStoreSchedule(editingSchedule!.id, {
        store_number: editingSchedule!.store_number,
        date: toDateOnlyString(editingSchedule!.date),
        employee_name: scheduleForm.employee_name,
        employee_id: scheduleForm.employee_id,
        role: scheduleForm.role,
        employee_type: scheduleForm.employee_type,
        scheduled_hours: scheduleForm.scheduled_hours,
        shift_time: scheduleForm.shift_time,
        notes: scheduleForm.notes,
      });
      await fetchSchedules();
      resetScheduleForm();
      setIsEditingSchedule(false);
      setEditingSchedule(null);
      handleSuccess(`Pharmacist schedule updated for Store #${selectedStore}`);
    } catch (error) {
      handleError(error, "updateSchedule");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting a pharmacist schedule
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm("Are you sure you want to delete this pharmacist schedule? This action cannot be undone.")) {
      return;
    }

    try {
      await apiService.deleteStoreSchedule(scheduleId);
      await fetchSchedules();
      handleSuccess("Pharmacist schedule has been deleted successfully");
    } catch (error) {
      handleError(error, "deleteSchedule");
    }
  };

  // Reset schedule form
  const resetScheduleForm = () => {
    setScheduleForm({
      employee_name: "",
      employee_id: "",
      role: "Pharmacist",
      employee_type: "Full Time",
      scheduled_hours: 8,
      shift_time: "",
      notes: ""
    });
  };

  // Start editing a schedule
  const startEditingSchedule = (schedule: StoreSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      employee_name: schedule.employee_name,
      employee_id: schedule.employee_id || "",
      role: schedule.role || "Pharmacist",
      employee_type: schedule.employee_type || "Full Time",
      scheduled_hours: schedule.scheduled_hours || 8,
      shift_time: schedule.shift_time,
      notes: schedule.notes
    });
    setIsEditingSchedule(true);
  };

  // Handle store selection
  const handleStoreChange = (storeNumber: number) => {
    setSelectedStore(storeNumber);
    setSelectedDate(null);
    setSchedulesForSelectedDate([]);
    setIsCreating(false);
    setIsEditing(false);
    setEditedContent("");
    setGeneralNotes("");
    setIsEditingSchedule(false);
    setEditingSchedule(null);
    resetScheduleForm();
  };

  useEffect(() => {
    if (activeTab === "store-scheduling") {
      fetchStores();
      fetchSchedules();
    }
  }, [activeTab, fetchStores, fetchSchedules]);

  return {
    // State
    schedules,
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
    
    // Computed values
    getCurrentStore,
    getSchedulesForStoreAndDate,
    
    // Actions
    setCurrentDate,
    setSelectedStore,
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
    fetchSchedules,
  };
}; 