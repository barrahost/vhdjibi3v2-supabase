import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SMSService } from '../../services/sms.service';
import { SMSTemplate, SMSRecipient } from '../../types/sms.types';
import { Search, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const SMS_HARD_LIMIT = 160;

export default function BulkSMSUndecided() {
  const { user } = useAuth();
  const [undecidedSouls, setUndecidedSouls] = useState<SMSRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ fullName: '', phone: '' });

  // Load user info
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) return;
      
      try {
        // Get user info from Firestore
        const userQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserInfo({
            fullName: userData.fullName || '',
            phone: userData.phone || ''
          });
        } else {
          // Try to get from admins collection
          const adminQuery = query(
            collection(db, 'admins'),
            where('uid', '==', user.uid)
          );
          const adminSnapshot = await getDocs(adminQuery);
          
          if (!adminSnapshot.empty) {
            const adminData = adminSnapshot.docs[0].data();
            setUserInfo({
              fullName: adminData.fullName || '',
              phone: adminData.phone || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    
    loadUserInfo();
  }, [user]);

  // Load undecided souls
  useEffect(() => {
    const loadUndecidedSouls = async () => {
      try {
        const soulsQuery = query(
          collection(db, 'souls'),
          where('isUndecided', '==', true),
          where('status', '==', 'active')
        );
        
        const snapshot = await getDocs(soulsQuery);
        const souls = snapshot.docs.map(doc => ({
          id: doc.id,
          fullName: doc.data().fullName,
          nickname: doc.data().nickname || null,
          phone: doc.data().phone.replace('+225', '')
        }));
        
        setUndecidedSouls(souls);
      } catch (error) {
        console.error('Error loading undecided souls:', error);
        toast.error('Erreur lors du chargement des âmes indécises');
      } finally {
        setLoading(false);
      }
    };

    loadUndecidedSouls();
  }, []);

  // Load SMS templates (catégorie "Suivi")
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await SMSService.getTemplates('Suivi');
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Erreur lors du chargement des modèles');
      }
    };

    loadTemplates();
  }, []);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.content);
    }
  };

  // Signature (avec indicatif +225 conservé)
  const userSignature = useMemo(() => {
    const nameParts = userInfo.fullName.split(' ').filter(Boolean);
    const signatureName = nameParts.slice(0, 2).join(' ');
    const signaturePhone = userInfo.phone || '';
    return `\n- ${signatureName} (${signaturePhone})`;
  }, [userInfo]);

  // Aperçu basé sur le 1er destinataire sélectionné
  const messagePreview = useMemo(() => {
    if (!message) return '';
    const firstSelectedId = Array.from(selectedRecipients)[0];
    const previewSoul = firstSelectedId
      ? undecidedSouls.find(s => s.id === firstSelectedId)
      : undefined;
    const exampleName = previewSoul?.fullName || 'Jean Kouassi';
    const exampleNickname = previewSoul?.nickname || exampleName.split(' ')[0];
    return message
      .replace(/\[nom\]/g, exampleName)
      .replace(/\[surnom\]/g, exampleNickname)
      + userSignature;
  }, [message, userSignature, selectedRecipients, undecidedSouls]);

  const previewCharCount = messagePreview.length;

  const handleSend = async () => {
    if (selectedRecipients.size === 0) {
      toast.error('Veuillez sélectionner au moins un destinataire');
      return;
    }

    if (!message.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    try {
      // Check if we have sufficient credits
      const creditCheck = await SMSService.checkSufficientCredits();
      if (!creditCheck.sufficient) {
        toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
        return;
      }
      
      setIsSending(true);
      const selectedSouls = undecidedSouls.filter(soul => selectedRecipients.has(soul.id));
      
      try {
        // Validate message length for each recipient after personalization
        for (const soul of selectedSouls) {
          const personalizedMessage = message
            .replace(/\[nom\]/g, soul.fullName)
            .replace(/\[surnom\]/g, soul.nickname || soul.fullName.split(' ')[0])
            + userSignature;

          if (personalizedMessage.length > SMS_HARD_LIMIT) {
            throw new Error(`Le message personnalisé pour ${soul.fullName} dépasse la limite de ${SMS_HARD_LIMIT} caractères`);
          }
        }

        const results = await SMSService.sendBatchSMS({
          recipients: selectedSouls.map(soul => ({
            id: soul.id,
            fullName: soul.fullName,
            nickname: soul.nickname,
            phone: soul.phone
          })),
          message: message + userSignature,
          templateId: selectedTemplate || undefined
        });

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        if (successful > 0) {
          toast.success(`${successful} message(s) envoyé(s) avec succès`);
        }
        if (failed > 0) {
          toast.error(`${failed} message(s) non envoyé(s)`);
        }

        if (failed === 0) {
          setMessage('');
          setSelectedRecipients(new Set());
          setSelectedTemplate('');
        }
      } catch (error) {
        throw error;
      }
    } catch (error: any) {
      if (error.message.includes('Crédit SMS insuffisant')) {
        toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
      } else {
        toast.error(error.message || 'Erreur lors de l\'envoi des messages');
      }
    } finally {
      setIsSending(false);
    }
  };

  const filteredSouls = undecidedSouls.filter(soul => 
    soul.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soul.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00665C] mx-auto"></div>
        <p className="mt-4 text-gray-500">Chargement des âmes indécises...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">À propos de l'envoi de SMS</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Ce menu vous permet d'envoyer des messages aux âmes indécises pour maintenir le contact et les encourager à rejoindre la cellule.</p>
              <p className="mt-1">Utilisez les variables [nom] et [surnom] pour personnaliser vos messages.</p>
              <p className="mt-1">Pour envoyer un SMS à une seule âme dans le cadre d'un suivi individuel, privilégiez l'envoi via la section "Interactions" dans la liste de vos âmes assignées.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Envoyer un message aux âmes indécises</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destinataires ({selectedRecipients.size} sélectionné(s))
            </label>
            
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une âme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>

            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              <div className="p-2 border-b bg-gray-50">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedRecipients.size === filteredSouls.length && filteredSouls.length > 0}
                    onChange={() => {
                      if (selectedRecipients.size === filteredSouls.length) {
                        setSelectedRecipients(new Set());
                      } else {
                        setSelectedRecipients(new Set(filteredSouls.map(soul => soul.id)));
                      }
                    }}
                    className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
                  />
                  <span className="text-sm font-medium">Tout sélectionner</span>
                </label>
              </div>
              
              <div className="divide-y">
                {filteredSouls.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucune âme indécise trouvée
                  </div>
                ) : (
                  filteredSouls.map(soul => (
                    <label key={soul.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.has(soul.id)}
                        onChange={() => {
                          const newSelected = new Set(selectedRecipients);
                          if (newSelected.has(soul.id)) {
                            newSelected.delete(soul.id);
                          } else {
                            newSelected.add(soul.id);
                          }
                          setSelectedRecipients(newSelected);
                        }}
                        className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
                      />
                      <span className="ml-2 flex-1">
                        <span className="block text-sm font-medium text-gray-900">{soul.fullName}</span>
                        <span className="block text-sm text-gray-500">{soul.phone}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modèle de message
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="">Sélectionnez un modèle</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                placeholder="Votre message..."
              />
              <div className="mt-1 text-sm text-gray-500">
                Votre nom et numéro seront automatiquement ajoutés à la fin du message.
              </div>
            </div>
          </div>

          {message && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">
                📱 Aperçu du message reçu par le destinataire :
              </p>
              <div className="bg-white rounded-lg border p-3 text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {messagePreview}
              </div>
              <p className={`mt-2 text-xs ${previewCharCount > SMS_HARD_LIMIT ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                Message final : {previewCharCount}/{SMS_HARD_LIMIT} caractères
                {previewCharCount > SMS_HARD_LIMIT && ' ⚠️ Trop long — raccourcir le message'}
              </p>
              {selectedRecipients.size > 1 && (
                <p className="mt-1 text-xs text-gray-400 italic">
                  * Aperçu basé sur le premier destinataire sélectionné
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setMessage('');
                setSelectedRecipients(new Set());
                setSelectedTemplate('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2 inline-block" />
              Effacer
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !message.trim() || selectedRecipients.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50 flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Envoi en cours...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}