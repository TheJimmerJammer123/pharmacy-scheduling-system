import React from 'react';
import { Calendar, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleForm } from './ScheduleForm';
import { ScheduleList } from './ScheduleList';
import { GeneralNotes } from './GeneralNotes';

interface GeneralNotesPanelProps {
  selectedStore: number;
  selectedDate: string | null;
  schedulesForSelectedDate: any[];
  isCreating: boolean;
  isEditingSchedule: boolean;
  isSaving: boolean;
  scheduleForm: any;
  generalNotes: any;
  isEditing: boolean;
  editedContent: string;
  getCurrentStore: any;
  onAddSchedule: () => void;
  onEditSchedule: (schedule: any) => void;
  onDeleteSchedule: (id: string) => void;
  onStartGeneralNotesEditing: () => void;
  onSaveGeneralNotes: () => void;
  onCancelGeneralNotesEditing: () => void;
  onContentChange: (content: string) => void;
  setScheduleForm: (form: any) => void;
  onSubmitScheduleForm: () => void;
  onCancelScheduleForm: () => void;
}

export const GeneralNotesPanel: React.FC<GeneralNotesPanelProps> = ({
  selectedStore,
  selectedDate,
  schedulesForSelectedDate,
  isCreating,
  isEditingSchedule,
  isSaving,
  scheduleForm,
  generalNotes,
  isEditing,
  editedContent,
  getCurrentStore,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onStartGeneralNotesEditing,
  onSaveGeneralNotes,
  onCancelGeneralNotesEditing,
  onContentChange,
  setScheduleForm,
  onSubmitScheduleForm,
  onCancelScheduleForm,
}) => {
  return (
    <div className="h-full p-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Store #{selectedStore} - {getCurrentStore?.city || 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {getCurrentStore ? (
            <div className="space-y-6">
              {/* Pharmacist Schedules Section */}
              {selectedDate && (
                <div>
                  {(isCreating || isEditingSchedule) && (
                    <ScheduleForm
                      scheduleForm={scheduleForm}
                      setScheduleForm={setScheduleForm}
                      isCreating={isCreating}
                      isEditingSchedule={isEditingSchedule}
                      isSaving={isSaving}
                      onSubmit={onSubmitScheduleForm}
                      onCancel={onCancelScheduleForm}
                    />
                  )}
                  
                  <ScheduleList
                    selectedDate={selectedDate}
                    schedulesForSelectedDate={schedulesForSelectedDate}
                    onAddSchedule={onAddSchedule}
                    onEditSchedule={onEditSchedule}
                    onDeleteSchedule={onDeleteSchedule}
                  />
                </div>
              )}

              {/* General Notes Section */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  General Notes
                </h4>
                
                <GeneralNotes
                  selectedDate={selectedDate}
                  generalNotes={generalNotes}
                  isEditing={isEditing}
                  editedContent={editedContent}
                  isSaving={isSaving}
                  onStartEditing={onStartGeneralNotesEditing}
                  onSave={onSaveGeneralNotes}
                  onCancel={onCancelGeneralNotesEditing}
                  onContentChange={onContentChange}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Store className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Loading store information...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 