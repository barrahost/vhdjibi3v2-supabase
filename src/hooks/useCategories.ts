import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only get active categories
    const q = query(
      collection(db, 'audio_categories'),
      where('status', '==', 'active'),
      orderBy('name', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      
      setCategories(categoriesData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des catégories');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { categories, loading };
}