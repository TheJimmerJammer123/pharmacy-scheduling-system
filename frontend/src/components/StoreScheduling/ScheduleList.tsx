import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { StoreSchedule } from "@/types/store";
import { ScheduleCard } from "./ScheduleCard";

interface ScheduleListProps {
  selectedDate: string | null;
  schedulesForSelectedDate: StoreSchedule[];
  onAddSchedule: () => void;
  onEditSchedule: (schedule: StoreSchedule) => void;
  onDeleteSchedule: (id: string) => void;
}

export const ScheduleList = memo(({
  selectedDate,
  schedulesForSelectedDate,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule
}: ScheduleListProps) => {
  const formatSelectedDate = useCallback(() => {
    if (!selectedDate) return '';
    const [year, month, day] = selectedDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }, [selectedDate]);

  if (!selectedDate) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Employee Schedules - {formatSelectedDate()}
        </h4>
        <Button
          onClick={onAddSchedule}
          size="sm"
          variant="outline"
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Schedule
        </Button>
      </div>
      
      {schedulesForSelectedDate.length > 0 ? (
        <div className="space-y-3">
          {schedulesForSelectedDate.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onEdit={onEditSchedule}
              onDelete={onDeleteSchedule}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No employee schedules for this date</p>
        </div>
      )}
    </div>
  );
}); 