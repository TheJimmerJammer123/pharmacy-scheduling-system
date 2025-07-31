import { memo } from "react";
import { Button } from "@/components/ui/button";
import { StoreSchedule, ScheduleFormData, EmployeeRole, EmployeeType } from "@/types/store";

interface ScheduleFormProps {
  scheduleForm: ScheduleFormData;
  setScheduleForm: (form: ScheduleFormData | ((prev: ScheduleFormData) => ScheduleFormData)) => void;
  isCreating: boolean;
  isEditingSchedule: boolean;
  isSaving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

const employeeRoles: EmployeeRole[] = ['Pharmacist', 'Pharmacy Technician', 'Cashier', 'Manager'];
const employeeTypes: EmployeeType[] = ['Full Time', 'Part Time', 'PRN', 'Temporary'];

export const ScheduleForm = memo(({
  scheduleForm,
  setScheduleForm,
  isCreating,
  isEditingSchedule,
  isSaving,
  onSubmit,
  onCancel
}: ScheduleFormProps) => {
  const updateFormField = (field: keyof ScheduleFormData, value: string | number) => {
    setScheduleForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border mb-4">
      <h5 className="font-medium text-sm mb-3">
        {isCreating ? "Add New Schedule" : "Edit Schedule"}
      </h5>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Employee Name *</label>
            <input
              type="text"
              value={scheduleForm.employee_name}
              onChange={(e) => updateFormField('employee_name', e.target.value)}
              className="w-full p-2 text-sm border border-border rounded-md bg-background"
              placeholder="Enter employee name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Employee ID</label>
            <input
              type="text"
              value={scheduleForm.employee_id}
              onChange={(e) => updateFormField('employee_id', e.target.value)}
              className="w-full p-2 text-sm border border-border rounded-md bg-background"
              placeholder="Enter employee ID"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select
              value={scheduleForm.role}
              onChange={(e) => updateFormField('role', e.target.value)}
              className="w-full p-2 text-sm border border-border rounded-md bg-background"
            >
              {employeeRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Employee Type</label>
            <select
              value={scheduleForm.employee_type}
              onChange={(e) => updateFormField('employee_type', e.target.value)}
              className="w-full p-2 text-sm border border-border rounded-md bg-background"
            >
              {employeeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Shift Time *</label>
            <input
              type="text"
              value={scheduleForm.shift_time}
              onChange={(e) => updateFormField('shift_time', e.target.value)}
              className="w-full p-2 text-sm border border-border rounded-md bg-background"
              placeholder="e.g., 9:00 AM - 5:00 PM"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Scheduled Hours</label>
            <input
              type="number"
              value={scheduleForm.scheduled_hours}
              onChange={(e) => updateFormField('scheduled_hours', parseInt(e.target.value) || 0)}
              className="w-full p-2 text-sm border border-border rounded-md bg-background"
              min="0"
              max="24"
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <textarea
            value={scheduleForm.notes}
            onChange={(e) => updateFormField('notes', e.target.value)}
            className="w-full p-2 text-sm border border-border rounded-md bg-background"
            placeholder="Enter any additional notes"
            rows={2}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? "Saving..." : (isCreating ? "Create Schedule" : "Update Schedule")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}); 