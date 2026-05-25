import { useState, useEffect } from 'react';
import { SMSTemplate } from '../../../types/sms.types';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';
import EditSMSTemplateModal from './EditSMSTemplateModal';
import { SMSTemplatePreview } from './SMSTemplatePreview';
import { CustomTable } from '../../ui/CustomTable';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { getChurchId } from '../../../lib/churchId';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useConfirmModal } from '../../../hooks/useConfirmModal';

export default function SMSTemplateList() {
  const { confirm, confirmModalProps } = useConfirmModal();
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('sms_templates').select('*').eq('church_id', getChurchId()).order('created_at', { ascending: false });
      setTemplates((data ?? []).map((row: any) => ({
        id: row.id, title: row.title, content: row.content,
        category: row.category, status: row.status,
        createdAt: row.created_at, updatedAt: row.updated_at, createdBy: row.created_by,
      } as SMSTemplate)));
      setLoading(false);
    };
    fetchTemplates();
    const channel = supabase.channel('sms-templates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sms_templates' }, fetchTemplates)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleDelete = async (templateId: string) => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.')) {
      try {
        const { error: _deleteErr } = await supabase.from('sms_templates').delete().eq('id', templateId);
        toast.success('Modèle supprimé avec succès');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Erreur lors de la suppression du modèle');
      }
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status?: string) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }`}>
      {status === 'active' ? 'Actif' : 'Inactif'}
    </span>
  );

  const actionButtons = (template: SMSTemplate) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); setEditingTemplateId(template.id); }}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
        title="Modifier"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const columns = [
    { key: 'title', title: 'Titre', render: (v: string) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'category', title: 'Catégorie', render: (v: string) => <span className="text-gray-500">{v || '-'}</span> },
    { key: 'content', title: 'Aperçu', render: (v: string) => <span className="text-gray-500">{v.slice(0, 50)}...</span> },
    { key: 'status', title: 'Statut', render: (v: string) => statusBadge(v) },
    { key: 'updatedAt', title: 'Dernière modification', render: (v: any) => <span className="text-gray-500">{formatDate(v)}</span> },
    { key: 'actions', title: 'Actions', render: (_: any, t: SMSTemplate) => actionButtons(t) },
  ];

  const renderTemplateMobileCard = (template: SMSTemplate) => (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 break-words">{template.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {template.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
                {template.category}
              </span>
            )}
            {statusBadge(template.status)}
          </div>
        </div>
        {actionButtons(template)}
      </div>
      <p className="mt-2.5 text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{template.content}</p>
      <p className="mt-2 text-xs text-gray-400">Modifié le {formatDate(template.updatedAt)}</p>
    </div>
  );

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un modèle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <CustomTable
        data={filteredTemplates}
        columns={columns}
        mobileCard={renderTemplateMobileCard}
      />

      {editingTemplateId && (
        <EditSMSTemplateModal
          templateId={editingTemplateId}
          isOpen={!!editingTemplateId}
          onClose={() => setEditingTemplateId(null)}
        />
      )}
    <ConfirmModal {...confirmModalProps} />
    </div>
  );
}