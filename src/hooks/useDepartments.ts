import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Department } from '../types/department.types';
import toast from 'react-hot-toast';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'departments'), orderBy('order', 'asc'));
    
    try {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setDepartments(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Department)));
        setLoading(false);
      }, (error) => {
        console.error('Error loading departments:', error);
        setError('Erreur lors du chargement des départements');
        toast.error('Erreur lors du chargement des départements');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up departments listener:', error);
      setError('Erreur lors de l\'initialisation');
      setLoading(false);
    }
  }, []);

  return { departments, loading, error };
}