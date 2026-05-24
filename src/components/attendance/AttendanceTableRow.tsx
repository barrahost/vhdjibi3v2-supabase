import { formatDate } from '../../utils/dateUtils';
import AttendanceActions from './AttendanceActions';
import { AttendanceRecord, Soul } from '../../types/attendance.types';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

interface AttendanceTableRowProps {
  attendance: AttendanceRecord;
  soul: Soul;
  onEdit: () => void;
}

export function AttendanceTableRow({ attendance, soul, onEdit }: AttendanceTableRowProps) {
  const { confirm, confirmModalProps } = useConfirmModal();
  if (!soul) return null;

  const handleDelete = async () => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer cette présence ?')) {
      try {
        const { error: _deleteErr } = await supabase.from('attendances').delete().eq('id', attendance.id);
        toast.success('Présence supprimée avec succès');
      } catch (error) {
        console.error('Error deleting attendance:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {soul.fullName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(attendance.date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          attendance.present
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {attendance.present ? 'Présent(e)' : 'Absent(e)'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {attendance.notes || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <AttendanceActions onEdit={onEdit} onDelete={handleDelete} />
      </td>
    <ConfirmModal {...confirmModalProps} />
    </tr>
  );
}