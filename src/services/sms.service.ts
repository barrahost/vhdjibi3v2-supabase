import { supabase } from '../lib/supabase';
import { SMSMessage } from '../types/sms.types';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';

export class SMSService {
  private static readonly MIN_SMS_THRESHOLD = 5; // Alerte si moins de 5 SMS restants

  // Check if SMS credits are sufficient
  static async checkSufficientCredits(): Promise<{
    sufficient: boolean;
    credits: number | null;
    smsCount: number | null;
  }> {
    try {
      const balance = await this.getSMSBalance();
      
      if (balance.credits === null) {
        return { sufficient: true, credits: null, smsCount: null };
      }
      
      return {
        sufficient: (balance.smsCount ?? 0) > this.MIN_SMS_THRESHOLD,
        credits: balance.credits,
        smsCount: balance.smsCount
      };
    } catch (error) {
      console.error('Error checking SMS credits:', error);
      return { sufficient: true, credits: null, smsCount: null };
    }
  }

  // Get SMS balance via Edge Function (Africa's Talking)
  static async getSMSBalance(): Promise<{
    credits: number | null;
    smsCount: number | null;
    currency: string;
    smsCostXOF: number;
    balanceRaw: string;
  }> {
    const defaultResult = { credits: null, smsCount: null, currency: 'XOF', smsCostXOF: 24, balanceRaw: '' };
    try {
      const { data, error } = await supabase.functions.invoke('check-sms-balance');
      
      if (error || !data) {
        console.error('Error getting balance:', error);
        return defaultResult;
      }
      
      return {
        credits:    typeof data.credits  === 'number' ? data.credits  : null,
        smsCount:   typeof data.smsCount === 'number' ? data.smsCount : null,
        currency:   data.currency   ?? 'XOF',
        smsCostXOF: data.smsCostXOF ?? 24,
        balanceRaw: data.balanceRaw ?? '',
      };
    } catch (error) {
      console.error('Error getting SMS balance:', error);
      return defaultResult;
    }
  }

  // Create an interaction record for SMS
  static async createSMSInteraction(
    shepherdId: string,
    soulId: string,
    message: string,
    date: Date
  ) {
    try {
      const { error: _insertErr } = await supabase.from('interactions').insert({
        type: 'message',
        soulId,
        shepherdId,
        date,
        notes: `Envoi du message suivant : ${message}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error creating SMS interaction:', error);
      throw new Error('Erreur lors de la création de l\'interaction');
    }
  }

  static async getTemplates(category?: string): Promise<any[]> {
    try {
      let q = supabase
        .from('sms_templates')
        .select('*')
        .eq('status', 'active')
        .order('title', { ascending: true });

      if (category) {
        q = q.eq('category', category);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        status: row.status as 'active' | 'inactive',
        category: row.category,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));
    } catch (error) {
      console.error('Error loading SMS templates:', error);
      throw new Error('Erreur lors du chargement des modèles SMS');
    }
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, any>;
      return errorObj.message || errorObj.error || 'Erreur inconnue';
    }
    return 'Une erreur inconnue est survenue';
  }

  private static personalizeMessage(message: string, name: string, nickname?: string): string {
    let personalizedMessage = message;
    personalizedMessage = personalizedMessage.replace(/\[nom\]/g, name);
    personalizedMessage = personalizedMessage.replace(/\[surnom\]/g, nickname || name.split(' ')[0]);
    return personalizedMessage;
  }

  // Send SMS via Edge Function
  static async sendSMS(
    recipients: string | string[],
    message: string,
    soulName?: string,
    soulNickname?: string,
    scheduleTime?: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          recipients,
          message,
          soulName,
          soulNickname,
          scheduleTime
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erreur lors de l\'envoi du SMS');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du SMS');
      }

      return data.result;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Erreur d\'envoi SMS:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  static async sendBatchSMS(messages: SMSMessage, scheduleTime?: string): Promise<any[]> {
    // Check if we have sufficient credits
    const creditCheck = await this.checkSufficientCredits();
    if (!creditCheck.sufficient) {
      toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
      throw new Error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;
    let shepherdId: string | null = null;
    let loadingToastId: string | null = null;

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const user = JSON.parse(userStr);
      shepherdId = user.id;

      const batchSize = 2;
      loadingToastId = toast.loading('Envoi des messages en cours...', { duration: Infinity });

      for (let i = 0; i < messages.recipients.length; i += batchSize) {
        const batch = messages.recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(async (recipient, index) => {
          try {
            const result = await this.sendSMS(
              recipient.phone,
              messages.message,
              recipient.fullName,
              recipient.nickname,
              scheduleTime
            );

            await this.createSMSInteraction(
              shepherdId!,
              recipient.id,
              messages.message,
              new Date()
            );

            successCount++;
            return { success: true, recipient, result };
          } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            failureCount++;
            console.error(`Erreur d'envoi SMS à ${recipient.fullName}:`, error);
            return { success: false, recipient, error: errorMessage };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        if (i + batchSize < messages.recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Error in sendBatchSMS:', error);
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      throw new Error(errorMessage);
    } finally {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} message${successCount > 1 ? 's' : ''} envoyé${successCount > 1 ? 's' : ''} avec succès`,
          { duration: 5000 }
        );
      }
      if (failureCount > 0) {
        toast.error(
          `${failureCount} message${failureCount > 1 ? 's' : ''} non envoyé${failureCount > 1 ? 's' : ''}`,
          { duration: 5000 }
        );
      }
    }

    return results;
  }

  private static async getCurrentShepherdId(): Promise<string | null> {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const user = JSON.parse(userStr);
      return user.id;
    } catch (error: any) {
      console.error('Error getting shepherd ID:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de la récupération de votre identifiant');
    }
  }
}