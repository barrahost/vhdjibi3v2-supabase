import { Pencil, Trash2 } from 'lucide-react';

interface AttendanceActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function AttendanceActions({ onEdit, onDelete }: AttendanceActionsProps) {
  return (
    <div className="flex justify-end space-x-2">
      <button
        onClick={onEdit}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        title="Modifier"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-1 text-red-600 hover:bg-red-50 rounded"
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}