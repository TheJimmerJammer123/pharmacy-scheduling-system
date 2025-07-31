import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Edit3, Plus } from "lucide-react";

interface GeneralNotesProps {
  selectedDate: string | null;
  generalNotes: string;
  isEditing: boolean;
  editedContent: string;
  isSaving: boolean;
  onStartEditing: () => void;
  onSave: () => void;
  onCancel: () => void;
  onContentChange: (content: string) => void;
}

export const GeneralNotes = memo(({
  selectedDate,
  generalNotes,
  isEditing,
  editedContent,
  isSaving,
  onStartEditing,
  onSave,
  onCancel,
  onContentChange
}: GeneralNotesProps) => {
  if (!selectedDate) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Click on a date in the calendar to view or create general notes</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <Textarea
          value={editedContent}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Enter general notes for this date..."
          className="min-h-[150px]"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? "Saving..." : "Save Notes"}
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
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">General Notes</label>
        <div className="mt-1 p-3 bg-muted/50 rounded-md">
          <p className="text-sm whitespace-pre-wrap">{generalNotes || "No notes for this date"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {generalNotes ? (
          <Button
            onClick={onStartEditing}
            size="sm"
            variant="outline"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit Notes
          </Button>
        ) : (
          <Button
            onClick={onStartEditing}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Notes
          </Button>
        )}
      </div>
    </div>
  );
}); 