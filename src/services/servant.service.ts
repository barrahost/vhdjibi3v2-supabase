import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Servant, ServantFormData, ServantSourceType } from '../types/servant.types';
import { validatePhoneNumber } from '../utils/phoneValidation';
import toast from 'react-hot-toast';

export interface ImportResult {
  imported: number;
  skipped: Array<{ name: string; reason: string }>;
}

export class ServantService {
  /**
   * Create a new servant
   */
  static async createServant(data: ServantFormData): Promise<string> {
    try {
      // If a source is provided, prevent importing the same person twice in the same department
      if (data.sourceType && data.sourceId) {
        const dupQuery = query(
          collection(db, 'servants'),
          where('sourceType', '==', data.sourceType),
          where('sourceId', '==', data.sourceId),
          where('departmentId', '==', data.departmentId)
        );
        const dupSnap = await getDocs(dupQuery);
        if (!dupSnap.empty) {
          throw new Error('Cette personne est déjà serviteur dans ce département');
        }
      } else {
        // Manual entry: prevent duplicate phone within the same department
        const phoneQuery = query(
          collection(db, 'servants'),
          where('phone', '==', data.phone),
          where('departmentId', '==', data.departmentId)
        );
        const phoneSnap = await getDocs(phoneQuery);
        if (!phoneSnap.empty) {
          throw new Error('Ce numéro est déjà utilisé pour un serviteur dans ce département');
        }

        // Cross-department check: avertissement non bloquant
        try {
          const globalPhoneQuery = query(
            collection(db, 'servants'),
            where('phone', '==', data.phone),
            where('status', '==', 'active')
          );
          const globalSnap = await getDocs(globalPhoneQuery);
          if (!globalSnap.empty) {
            const otherDepts = globalSnap.docs
              .map(d => d.data() as any)
              .filter(d => d.departmentId !== data.departmentId)
              .map(d => d.departmentId);
            if (otherDepts.length > 0) {
              console.warn(
                `[Servants] Numéro ${data.phone} déjà utilisé dans ${otherDepts.length} autre(s) département(s)`
              );
            }
          }
        } catch (e) {
          console.warn('Cross-department duplicate check failed', e);
        }
      }

      // If this servant will be a department head, check if there's already a head
      if (data.isHead) {
        const headQuery = query(
          collection(db, 'servants'),
          where('departmentId', '==', data.departmentId),
          where('isHead', '==', true),
          where('status', '==', 'active')
        );
        const headSnapshot = await getDocs(headQuery);
        if (!headSnapshot.empty) {
          throw new Error('Ce département a déjà un responsable');
        }
      }

      // Create the servant document
      const servantData: any = {
        fullName: data.fullName.trim(),
        nickname: data.nickname?.trim() || null,
        gender: data.gender,
        phone: data.phone,
        email: data.email?.trim() || null,
        departmentId: data.departmentId,
        isHead: data.isHead,
        isShepherd: data.isShepherd || false,
        shepherdId: data.shepherdId || null,
        sourceType: data.sourceType || 'manual',
        sourceId: data.sourceId || null,
        originalSoulId: data.originalSoulId || (data.sourceType === 'soul' ? data.sourceId : null) || null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'servants'), servantData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating servant:', error);
      throw error;
    }
  }

  /**
   * Get a servant by ID
   */
  static async getServant(id: string): Promise<Servant | null> {
    try {
      const docRef = doc(db, 'servants', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Servant;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting servant:', error);
      throw error;
    }
  }

  /**
   * Update a servant
   */
  static async updateServant(id: string, data: Partial<ServantFormData>): Promise<void> {
    try {
      const servantRef = doc(db, 'servants', id);
      const servantSnap = await getDoc(servantRef);
      
      if (!servantSnap.exists()) {
        throw new Error('Serviteur non trouvé');
      }
      
      const currentServant = servantSnap.data() as Servant;
      
      // Validate phone number if it's being updated
      let formattedPhone = currentServant.phone;
      if (data.phone) {
        const phoneValidation = validatePhoneNumber(data.phone);
        if (!phoneValidation.isValid) {
          throw new Error(phoneValidation.error);
        }
        formattedPhone = phoneValidation.formattedNumber || '';
        
        // Check if the new phone number is already used by another servant
        if (formattedPhone !== currentServant.phone) {
          const phoneQuery = query(
            collection(db, 'servants'),
            where('phone', '==', formattedPhone)
          );
          const phoneSnapshot = await getDocs(phoneQuery);
          if (!phoneSnapshot.empty && phoneSnapshot.docs[0].id !== id) {
            throw new Error('Ce numéro de téléphone est déjà utilisé');
          }
        }
      }
      
      // Check email uniqueness if it's being updated
      let formattedEmail = currentServant.email;
      if (data.email !== undefined) {
        formattedEmail = data.email?.trim() || '';
        
        if (formattedEmail && formattedEmail !== currentServant.email) {
          const emailQuery = query(
            collection(db, 'servants'),
            where('email', '==', formattedEmail)
          );
          const emailSnapshot = await getDocs(emailQuery);
          if (!emailSnapshot.empty && emailSnapshot.docs[0].id !== id) {
            throw new Error('Cet email est déjà utilisé');
          }
        }
      }
      
      // If changing department or head status, check for existing department head
      if ((data.departmentId && data.departmentId !== currentServant.departmentId) || 
          (data.isHead !== undefined && data.isHead !== currentServant.isHead)) {
        
        const newDepartmentId = data.departmentId || currentServant.departmentId;
        const newIsHead = data.isHead !== undefined ? data.isHead : currentServant.isHead;
        
        if (newIsHead) {
          const headQuery = query(
            collection(db, 'servants'),
            where('departmentId', '==', newDepartmentId),
            where('isHead', '==', true),
            where('status', '==', 'active')
          );
          const headSnapshot = await getDocs(headQuery);
          
          if (!headSnapshot.empty && headSnapshot.docs[0].id !== id) {
            throw new Error('Ce département a déjà un responsable');
          }
        }
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {
        updatedAt: new Date()
      };
      
      if (data.fullName) updateData.fullName = data.fullName.trim();
      if (data.nickname !== undefined) updateData.nickname = data.nickname?.trim() || null;
      if (data.gender) updateData.gender = data.gender;
      if (data.phone) updateData.phone = formattedPhone;
      if (data.email !== undefined) updateData.email = formattedEmail;
      if (data.departmentId) updateData.departmentId = data.departmentId;
      if (data.isHead !== undefined) updateData.isHead = data.isHead;
      if (data.isShepherd !== undefined) updateData.isShepherd = data.isShepherd;
      if (data.shepherdId !== undefined) updateData.shepherdId = data.shepherdId;
      if (data.status !== undefined) updateData.status = data.status;
      
      // Update the servant
      await updateDoc(servantRef, updateData);
    } catch (error) {
      console.error('Error updating servant:', error);
      throw error;
    }
  }

  /**
   * Delete a servant
   */
  static async deleteServant(id: string): Promise<void> {
    try {
      const servantRef = doc(db, 'servants', id);
      const servantSnap = await getDoc(servantRef);
      
      if (!servantSnap.exists()) {
        throw new Error('Serviteur non trouvé');
      }
      
      const servant = servantSnap.data() as Servant;
      
      // If the servant is a department head, we should handle this carefully
      if (servant.isHead) {
        // Option 1: Prevent deletion and suggest making someone else the head first
        throw new Error('Ce serviteur est responsable de département. Veuillez désigner un autre responsable avant de le supprimer.');
        
        // Option 2: Set status to inactive instead of deleting
        // await updateDoc(servantRef, {
        //   status: 'inactive',
        //   updatedAt: new Date()
        // });
        // return;
      }
      
      // Delete the servant
      await deleteDoc(servantRef);
    } catch (error) {
      console.error('Error deleting servant:', error);
      throw error;
    }
  }

  /**
   * Get all servants
   */
  static async getAllServants(): Promise<Servant[]> {
    try {
      const q = query(
        collection(db, 'servants'),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Servant));
    } catch (error) {
      console.error('Error getting all servants:', error);
      throw error;
    }
  }

  /**
   * Get servants by department
   */
  static async getServantsByDepartment(departmentId: string): Promise<Servant[]> {
    try {
      const q = query(
        collection(db, 'servants'),
        where('departmentId', '==', departmentId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Servant));
    } catch (error) {
      console.error('Error getting servants by department:', error);
      throw error;
    }
  }

  /**
   * Get department head
   */
  static async getDepartmentHead(departmentId: string): Promise<Servant | null> {
    try {
      const q = query(
        collection(db, 'servants'),
        where('departmentId', '==', departmentId),
        where('isHead', '==', true),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as Servant;
    } catch (error) {
      console.error('Error getting department head:', error);
      throw error;
    }
  }

  /**
   * Assign a servant as department head
   */
  static async assignDepartmentHead(servantId: string, departmentId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // First, remove any existing department head
      const currentHeadQuery = query(
        collection(db, 'servants'),
        where('departmentId', '==', departmentId),
        where('isHead', '==', true),
        where('status', '==', 'active')
      );
      
      const currentHeadSnapshot = await getDocs(currentHeadQuery);
      if (!currentHeadSnapshot.empty) {
        const currentHeadRef = doc(db, 'servants', currentHeadSnapshot.docs[0].id);
        batch.update(currentHeadRef, {
          isHead: false,
          updatedAt: new Date()
        });
      }
      
      // Then, assign the new head
      const servantRef = doc(db, 'servants', servantId);
      batch.update(servantRef, {
        departmentId,
        isHead: true,
        updatedAt: new Date()
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error assigning department head:', error);
      throw error;
    }
  }

  /**
   * Get all servants who are also shepherds
   */
  static async getServantShepherds(): Promise<Servant[]> {
    try {
      const q = query(
        collection(db, 'servants'),
        where('isShepherd', '==', true),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Servant));
    } catch (error) {
      console.error('Error getting servant shepherds:', error);
      throw error;
    }
  }

  /**
   * Bulk delete servants
   * Department heads will be deactivated instead of deleted
   */
  static async bulkDeleteServants(servantIds: string[]): Promise<{ deleted: number; deactivated: number }> {
    try {
      const batch = writeBatch(db);
      let deletedCount = 0;
      let deactivatedCount = 0;

      // Process each servant
      for (const servantId of servantIds) {
        const servantRef = doc(db, 'servants', servantId);
        const servantSnap = await getDoc(servantRef);
        
        if (!servantSnap.exists()) {
          console.warn(`Servant ${servantId} not found, skipping`);
          continue;
        }
        
        const servant = servantSnap.data() as Servant;
        
        // If the servant is a department head, deactivate instead of delete
        if (servant.isHead) {
          batch.update(servantRef, {
            status: 'inactive',
            updatedAt: new Date()
          });
          deactivatedCount++;
        } else {
          batch.delete(servantRef);
          deletedCount++;
        }
      }

      await batch.commit();
      
      return { deleted: deletedCount, deactivated: deactivatedCount };
    } catch (error) {
      console.error('Error in bulk delete servants:', error);
      throw error;
    }
  }

  /**
   * Find existing servants for a department restricted to a list of source ids.
   * Returns a Set of sourceId already present in the department.
   */
  private static async getExistingSourceIds(
    departmentId: string,
    sourceType: ServantSourceType,
    sourceIds: string[]
  ): Promise<Set<string>> {
    const existing = new Set<string>();
    if (sourceIds.length === 0) return existing;

    // Firestore "in" supports up to 10 values; chunk it.
    const chunks: string[][] = [];
    for (let i = 0; i < sourceIds.length; i += 10) {
      chunks.push(sourceIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const q = query(
        collection(db, 'servants'),
        where('departmentId', '==', departmentId),
        where('sourceType', '==', sourceType),
        where('sourceId', 'in', chunk)
      );
      const snap = await getDocs(q);
      snap.docs.forEach(d => {
        const data = d.data() as any;
        if (data.sourceId) existing.add(data.sourceId);
      });
    }
    return existing;
  }

  /**
   * Import servants from existing souls.
   */
  static async importFromSouls(soulIds: string[], departmentId: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: [] };
    if (soulIds.length === 0 || !departmentId) return result;

    const existing = await this.getExistingSourceIds(departmentId, 'soul', soulIds);

    // Fetch souls in chunks of 10 (documentId in)
    const chunks: string[][] = [];
    for (let i = 0; i < soulIds.length; i += 10) {
      chunks.push(soulIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const snap = await getDocs(
        query(collection(db, 'souls'), where(documentId(), 'in', chunk))
      );

      for (const soulDoc of snap.docs) {
        const soul = soulDoc.data() as any;
        const name = soul.fullName || 'Inconnu';

        if (existing.has(soulDoc.id)) {
          result.skipped.push({ name, reason: 'Déjà serviteur dans ce département' });
          continue;
        }

        try {
          await addDoc(collection(db, 'servants'), {
            fullName: (soul.fullName || '').trim(),
            nickname: soul.nickname?.trim() || null,
            gender: soul.gender || 'male',
            phone: soul.phone || '',
            email: soul.email?.trim() || null,
            departmentId,
            isHead: false,
            isShepherd: false,
            shepherdId: null,
            sourceType: 'soul',
            sourceId: soulDoc.id,
            originalSoulId: soulDoc.id,
            promotionDate: new Date(),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          result.imported++;
        } catch (e: any) {
          console.error('Error importing soul as servant:', e);
          result.skipped.push({ name, reason: e?.message || 'Erreur inconnue' });
        }
      }
    }

    return result;
  }

  /**
   * Import servants from existing users (any role).
   */
  static async importFromUsers(userDocIds: string[], departmentId: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: [] };
    if (userDocIds.length === 0 || !departmentId) return result;

    const existing = await this.getExistingSourceIds(departmentId, 'user', userDocIds);

    const chunks: string[][] = [];
    for (let i = 0; i < userDocIds.length; i += 10) {
      chunks.push(userDocIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const snap = await getDocs(
        query(collection(db, 'users'), where(documentId(), 'in', chunk))
      );

      for (const userDoc of snap.docs) {
        const user = userDoc.data() as any;
        const name = user.fullName || 'Inconnu';

        if (existing.has(userDoc.id)) {
          result.skipped.push({ name, reason: 'Déjà serviteur dans ce département' });
          continue;
        }

        try {
          await addDoc(collection(db, 'servants'), {
            fullName: (user.fullName || '').trim(),
            nickname: user.nickname?.trim() || null,
            gender: user.gender || 'male',
            phone: user.phone || '',
            email: user.email?.trim() || null,
            departmentId,
            isHead: false,
            isShepherd: user.role === 'shepherd' || !!user.businessProfiles?.some?.((p: any) => p.type === 'shepherd'),
            shepherdId: null,
            sourceType: 'user',
            sourceId: userDoc.id,
            originalSoulId: null,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          result.imported++;
        } catch (e: any) {
          console.error('Error importing user as servant:', e);
          result.skipped.push({ name, reason: e?.message || 'Erreur inconnue' });
        }
      }
    }

    return result;
  }
}