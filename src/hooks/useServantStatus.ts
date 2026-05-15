import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ServantStatus {
  isServant: boolean;
  isDepartmentHead: boolean;
  departmentId?: string;
  loading: boolean;
}

export function useServantStatus(userEmail: string | undefined): ServantStatus {
  const [status, setStatus] = useState<ServantStatus>({
    isServant: false,
    isDepartmentHead: false,
    loading: true,
  });

  useEffect(() => {
    if (!userEmail) {
      setStatus({ isServant: false, isDepartmentHead: false, loading: false });
      return;
    }

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('servants')
          .select('id, is_head, department_id')
          .eq('email', userEmail)
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const servant = data[0];
          setStatus({
            isServant: true,
            isDepartmentHead: servant.is_head === true,
            departmentId: servant.department_id,
            loading: false,
          });
        } else {
          setStatus({ isServant: false, isDepartmentHead: false, loading: false });
        }
      } catch (error) {
        console.error('Error checking servant status:', error);
        setStatus({ isServant: false, isDepartmentHead: false, loading: false });
      }
    };

    check();
  }, [userEmail]);

  return status;
}
