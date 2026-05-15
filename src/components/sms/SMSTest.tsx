import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SMSService } from '../../services/sms.service';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const MAX_SMS_LENGTH = 125; // Reduced to 125 to allow for appending user info

export function SMSTest() {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Test message from VHAGC');
  const [isSending, setIsSending] = useState(false);
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
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    
    loadUserInfo();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Check if we have sufficient credits
      const creditCheck = await SMSService.checkSufficientCredits();
      if (!creditCheck.sufficient) {
        toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
        return;
      }
      
      setIsSending(true);
      
      // Get user surname (first part of fullName)
      // Get first two names from user's full name (or just one if that's all they have)
      const nameParts = userInfo.fullName.split(' ');
      const userSignatureName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[1]}`
        : nameParts[0] || '';
      const userPhone = userInfo.phone.replace('+225', '') || '';
      
      // Append user info to the message
      const userSignature = `\n- ${userSignatureName} (${userPhone})`;
      
      await SMSService.sendSMS(phone, message + userSignature);
      toast.success('SMS envoyé avec succès');
      setPhone('');
      setMessage('Test message from VHAGC');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Crédit SMS insuffisant')) {
        toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
      } else {
        console.error('Error sending SMS:', error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi du SMS');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold text-[#00665C] mb-4">Test d'envoi SMS</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de téléphone
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              +225
            </span>
            <input
              type="tel"
              required
              placeholder="0757000203"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                const truncated = value.slice(0, 10);
                setPhone(truncated);
              }}
              className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              maxLength={10}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={MAX_SMS_LENGTH}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
          <p className={`mt-1 text-sm ${
            message.length > MAX_SMS_LENGTH - 20 ? 'text-amber-600' : 'text-gray-500'
          }`}>
            {message.length}/{MAX_SMS_LENGTH} caractères
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Votre nom et numéro seront automatiquement ajoutés à la fin du message.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSending || !phone || !message.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50"
        >
          {isSending ? 'Envoi en cours...' : 'Envoyer le SMS test'}
        </button>
      </form>
    </div>
  );
}