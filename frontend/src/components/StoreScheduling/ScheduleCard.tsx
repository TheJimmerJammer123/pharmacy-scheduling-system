import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2 } from "lucide-react";
import { StoreSchedule } from "@/types/store";

interface ScheduleCardProps {
  schedule: StoreSchedule;
  onEdit: (schedule: StoreSchedule) => void;
  onDelete: (id: string) => void;
}

export const ScheduleCard = memo(({ schedule, onEdit, onDelete }: ScheduleCardProps) => {
  const handleEdit = useCallback(() => {
    onEdit(schedule);
  }, [onEdit, schedule]);

  const handleDelete = useCallback(() => {
    onDelete(schedule.id);
  }, [onDelete, schedule.id]);

  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-sm text-primary">{schedule.employee_name}</h5>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {schedule.employee_type || 'N/A'}
          </Badge>
          <Button
            onClick={handleEdit}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            title="Edit schedule"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            onClick={handleDelete}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Delete schedule"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">Shift:</span> {schedule.shift_time}
        </div>
        <div>
          <span className="font-medium">Hours:</span> {schedule.scheduled_hours || 'N/A'}
        </div>
        {schedule.employee_id && (
          <div>
            <span className="font-medium">ID:</span> {schedule.employee_id}
          </div>
        )}
        <div>
          <span className="font-medium">Role:</span> {schedule.role || 'N/A'}
        </div>
      </div>
      
      {schedule.notes && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">{schedule.notes}</p>
        </div>
      )}
    </div>
  );
}); 