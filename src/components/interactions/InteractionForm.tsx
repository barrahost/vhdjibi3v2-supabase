import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { SMSService } from '../../services/sms.service';
import { SMSTemplate } from '../../types/sms.types';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

const MAX_SMS_LENGTH = 125;

interface InteractionFormProps {
  soulId: string;
  shepherdId: string;
  onSuccess?: () => void;
  onClose: () => void;
  sourceCollection?: 'souls' | 'evangelized_souls';
}

export default function InteractionForm({ soulId, shepherdId, onSuccess, onClose, sourceCollection = 'souls' }: InteractionFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'call' as 'call' | 'visit' | 'message' | 'sms',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    notes: '',
    template: '',
    messageContent: ''
  });
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [userInfo, setUserInfo] = useState({ fullName: '', phone: '' });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await SMSService.getTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Erreur lors du chargement des modèles');
      }
    };
    if (formData.type === 'sms') {
      loadTemplates();
    }
  }, [formData.type]);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = localUser.id;
        if (!currentUserId) return;

        const { data: rows } = await supabase
          .from('users')
          .select('full_name, phone')
          .eq('church_id', getChurchId())
          .eq('id', currentUserId)
          .limit(1);

        if (rows && rows.length > 0) {
          setUserInfo({
            fullName: rows[0].full_name || '',
            phone: rows[0].phone || ''
          });
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    loadUserInfo();
  }, [user]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template: templateId,
        messageContent: template.content
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.time.split(':').map(Number);
      const interactionDate = new Date(year, month - 1, day, hours, minutes);

      if (formData.type === 'sms') {
        setIsSending(true);
        try {
          if (!formData.messageContent.trim()) {
            throw new Error('Le message ne peut pas être vide');
          }

          const creditCheck = await SMSService.checkSufficientCredits();
          if (!creditCheck.sufficient) {
            toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
            return;
          }

          const phone = await getSoulPhone(soulId);
          if (!phone) return;

          // Récupérer les infos de l'âme depuis Supabase
          const table = sourceCollection === 'evangelized_souls' ? 'evangelized_souls' : 'souls';
          const { data: soulRows } = await supabase
            .from(table)
            .select('full_name, nickname')
            .eq('id', soulId)
            .limit(1);

          if (!soulRows || soulRows.length === 0) {
            throw new Error('Données de l\'âme non trouvées');
          }

          const soulFullName = soulRows[0].full_name || '';
          const soulNickname = soulRows[0].nickname || '';

          const userSurname = userInfo.fullName.split(' ')[0] || '';
          const userPhone = userInfo.phone.replace('+225', '') || '';
          const userSignature = '\n- ' + userSurname + ' (' + userPhone + ')';

          const personalizedMessage = formData.messageContent
            .replace(/\[nom\]/g, soulFullName)
            .replace(/\[surnom\]/g, soulNickname || soulFullName.split(' ')[0])
            + userSignature;

          await SMSService.sendSMS(phone, personalizedMessage, soulFullName, soulNickname);

          const smsInteractionData: Record<string, any> = {
            id: crypto.randomUUID(),
            type: formData.type,
            soul_id: soulId,
            shepherd_id: shepherdId,
            soul_snapshot_name: soulFullName || null,
            actor_snapshot_name: userInfo.fullName || null,
            source_collection: sourceCollection,
            date: interactionDate.toISOString(),
            notes: 'Envoi du message suivant:\n' + personalizedMessage,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insertErr } = await supabase.from('interactions').insert(smsInteractionData);
          if (insertErr) {
            if (insertErr.code === 'PGRST204' || insertErr.message?.includes('source_collection')) {
              const { error: retryErr } = await supabase.from('interactions').insert({
        church_id: getChurchId(), ...smsInteractionData, source_collection: undefined });
              if (retryErr) throw retryErr;
            } else {
              throw insertErr;
            }
          }

          toast.success('Message envoyé et interaction enregistrée');
          onSuccess?.();
          onClose();
        } catch (error) {
          if (error instanceof Error && error.message.includes('Crédit SMS insuffisant')) {
            toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
          } else {
            console.error('Error sending SMS:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi du SMS');
          }
          return;
        } finally {
          setIsSending(false);
        }
        return;
      }

      // Pour les autres types d'interactions
      // Fetch soul name snapshot
      let soulSnapshotName: string | null = null;
      try {
        const table2 = sourceCollection === 'evangelized_souls' ? 'evangelized_souls' : 'souls';
        const { data: soulSnap } = await supabase.from(table2).select('full_name').eq('id', soulId).limit(1).single();
        soulSnapshotName = soulSnap?.full_name || null;
      } catch (_) {}

      let actorSnapshotName: string | null = null;
      try {
        const { data: actorSnap } = await supabase.from('users').select('full_name').eq('church_id', getChurchId()).eq('id', shepherdId).limit(1).single();
        actorSnapshotName = actorSnap?.full_name || null;
      } catch (_) {}

      const interactionData: Record<string, any> = {
        id: crypto.randomUUID(),
        type: formData.type,
        soul_id: soulId,
        shepherd_id: shepherdId,
        soul_snapshot_name: soulSnapshotName,
        actor_snapshot_name: actorSnapshotName,
        source_collection: sourceCollection,
        date: interactionDate.toISOString(),
        notes: formData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertErr } = await supabase.from('interactions').insert(interactionData);

      if (insertErr) {
        // Fallback: retry without source_collection if column doesn't exist yet
        if (insertErr.code === 'PGRST204' || insertErr.message?.includes('source_collection')) {
          const { error: retryErr } = await supabase.from('interactions').insert({
        church_id: getChurchId(),
            ...interactionData,
            source_collection: undefined
          });
          if (retryErr) throw retryErr;
        } else {
          throw insertErr;
        }
      }

      toast.success('Interaction enregistrée avec succès');
      onSuccess?.();
      onClose();

      setFormData({
        type: 'call',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        notes: '',
        template: '',
        messageContent: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  // Récupérer le numéro de téléphone de l'âme
  const getSoulPhone = async (soulId: string): Promise<string | null> => {
    try {
      const table = sourceCollection === 'evangelized_souls' ? 'evangelized_souls' : 'souls';
      const { data: rows, error } = await supabase
        .from(table)
        .select('phone')
        .eq('id', soulId)
        .limit(1);

      if (error) throw error;
      if (!rows || rows.length === 0) {
        toast.error('Âme non trouvée');
        return null;
      }
      return rows[0].phone?.replace('+225', '') || null;
    } catch (error) {
      console.error('Error getting soul phone:', error);
      toast.error('Erreur lors de la récupération du numéro de téléphone');
      return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type d'interaction
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            type: e.target.value as 'call' | 'visit' | 'sms' | 'message',
            notes: ''
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <option value="call">Appel</option>
          <option value="visit">Visite</option>
          <option value="sms">SMS</option>
          <option value="message">Message</option>
        </select>
      </div>

      {formData.type === 'sms' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modèle de message
            </label>
            <select
              value={formData.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="">Sélectionnez un modèle</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={formData.messageContent}
              onChange={(e) => setFormData(prev => ({ ...prev, messageContent: e.target.value }))}
              rows={4}
              maxLength={MAX_SMS_LENGTH}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              placeholder="Votre message..."
            />
            <p className={`mt-1 text-sm ${formData.messageContent.length > MAX_SMS_LENGTH - 20 ? 'text-amber-600' : 'text-gray-500'}`}>
              {formData.messageContent.length}/{MAX_SMS_LENGTH} caractères
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Votre nom et numéro seront automatiquement ajoutés à la fin du message.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400 font-normal">(facultatif)</span>
          </label>
          {(formData.type === 'call' || formData.type === 'visit') && (
            <div className="flex flex-wrap gap-2 mb-2">
              {['Pas de réponse', 'A rappelé', 'RDV pris', 'Absent'].map(note => (
                <button
                  key={note}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, notes: note }))}
                  className="px-2.5 py-1 text-xs font-medium text-[#00665C] border border-[#00665C]/40 rounded-full hover:bg-[#00665C]/10"
                >
                  {note}
                </button>
              ))}
            </div>
          )}
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C] h-32 resize-none"
            placeholder={formData.type === 'message' ? "Contenu du message (WhatsApp, etc.)..." : "Détails de l'interaction..."}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date de l'interaction"
          id="date"
          type="date"
          required
          value={formData.date}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, date: e.target.value }))}
        />
        <Input
          label="Heure"
          id="time"
          type="time"
          required
          value={formData.time}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, time: e.target.value }))}
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={formData.type === 'sms' && (!formData.messageContent.trim() || isSending)}
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50"
        >
          {formData.type === 'sms'
            ? (isSending ? 'Envoi en cours...' : 'Envoyer le message')
            : 'Enregistrer l\'interaction'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isSending}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Fermer
        </button>
      </div>
    </form>
  );
}
