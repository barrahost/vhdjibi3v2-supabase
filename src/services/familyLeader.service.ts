import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ServiceFamily, Soul } from '../types/database.types';

export class FamilyLeaderService {
  /** Trouve la famille dont le user est responsable (via leaderId). */
  static async getFamilyByLeaderId(userId: string): Promise<ServiceFamily | null> {
    const q = query(collection(db, 'serviceFamilies'), where('leaderId', '==', userId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as ServiceFamily;
  }

  /** Liste les âmes assignées à une famille. */
  static async getSoulsByFamilyId(familyId: string): Promise<Soul[]> {
    const q = query(collection(db, 'souls'), where('serviceFamilyId', '==', familyId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Soul));
  }

  /** Met à jour le berger assigné à une âme. */
  static async assignShepherdToSoul(soulId: string, shepherdId: string | null) {
    await updateDoc(doc(db, 'souls', soulId), {
      shepherdId: shepherdId || null,
      updatedAt: new Date(),
    });
  }

  /** Récupère les bergers de la famille (depuis shepherdIds). */
  static async getShepherdsOfFamily(shepherdIds: string[] = []): Promise<{ id: string; fullName: string }[]> {
    if (shepherdIds.length === 0) return [];
    const results = await Promise.all(
      shepherdIds.map(async (id) => {
        const s = await getDoc(doc(db, 'users', id));
        return s.exists() ? { id: s.id, fullName: s.data().fullName } : null;
      })
    );
    return results.filter((x): x is { id: string; fullName: string } => x !== null);
  }
}
