import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SMSStatusType = 'loading' | 'ok' | 'low' | 'empty' | 'api_error' | 'unsupported';

export interface SMSStatusResult {
  status: SMSStatusType;
  credits: number | null;     // solde XOF (float)
  smsCount: number | null;    // SMS estimés restants
  smsCostXOF: number;         // coût par SMS en XOF
  balanceRaw: string;         // ex: "XOF 43.2338"
  refresh: () => void;
}

const DEFAULT_SMS_COST_XOF = 24;   // ~0.04 USD × 600 XOF/USD
const LOW_SMS_THRESHOLD    = 10;   // alerte si < 10 SMS restants
const REFRESH_INTERVAL_MS  = 5 * 60 * 1000; // 5 minutes

export function useSMSStatus(): SMSStatusResult {
  const [status, setStatus]       = useState<SMSStatusType>('loading');
  const [credits, setCredits]     = useState<number | null>(null);
  const [smsCount, setSmsCount]   = useState<number | null>(null);
  const [smsCostXOF, setSmsCostXOF] = useState<number>(DEFAULT_SMS_COST_XOF);
  const [balanceRaw, setBalanceRaw] = useState<string>('');

  const checkStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-sms-balance');

      if (error || !data) {
        setStatus('api_error');
        setCredits(null);
        setSmsCount(null);
        return;
      }

      if (data.unsupported) {
        setStatus('unsupported');
        setCredits(null);
        setSmsCount(null);
        setSmsCostXOF(typeof data.smsCostXOF === 'number' ? data.smsCostXOF : DEFAULT_SMS_COST_XOF);
        return;
      }

      const bal  = typeof data.credits  === 'number' ? data.credits  : null;
      const sms  = typeof data.smsCount === 'number' ? data.smsCount : null;
      const cost = typeof data.smsCostXOF === 'number' ? data.smsCostXOF : DEFAULT_SMS_COST_XOF;

      if (bal === null) {
        setStatus('api_error');
      } else if (bal === 0 || (sms !== null && sms === 0)) {
        setStatus('empty');
      } else if (sms !== null && sms <= LOW_SMS_THRESHOLD) {
        setStatus('low');
      } else {
        setStatus('ok');
      }

      setCredits(bal);
      setSmsCount(sms);
      setSmsCostXOF(cost);
      setBalanceRaw(data.balanceRaw ?? '');
    } catch {
      setStatus('api_error');
      setCredits(null);
      setSmsCount(null);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return { status, credits, smsCount, smsCostXOF, balanceRaw, refresh: checkStatus };
}
