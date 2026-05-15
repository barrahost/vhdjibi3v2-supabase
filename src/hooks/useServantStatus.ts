import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    loading: true
  });

  useEffect(() => {
    if (!userEmail) {
      setStatus({
        isServant: false,
        isDepartmentHead: false,
        loading: false
      });
      return;
    }

    const checkServantStatus = async () => {
      try {
        const servantsRef = collection(db, 'servants');
        const q = query(servantsRef, where('email', '==', userEmail));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const servantData = snapshot.docs[0].data();
          setStatus({
            isServant: true,
            isDepartmentHead: servantData.isHead === true,
            departmentId: servantData.departmentId,
            loading: false
          });
        } else {
          setStatus({
            isServant: false,
            isDepartmentHead: false,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error checking servant status:', error);
        setStatus({
          isServant: false,
          isDepartmentHead: false,
          loading: false
        });
      }
    };

    checkServantStatus();
  }, [userEmail]);

  return status;
}
