import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserRole {
  isAdmin: boolean;
  isShepherd: boolean;
  isADN: boolean;
  adminRole?: string;
}

export async function getUserRole(uid: string): Promise<UserRole> {
  try {
    // Vérifier dans la collection users
    const userQuery = query(
      collection(db, 'users'),
      where('uid', '==', uid),
      where('status', '==', 'active')
    );
    const userDocs = await getDocs(userQuery);
    
    let isAdmin = false;
    let isShepherd = false;
    let isADN = false;
    let adminRole = null;
    
    if (!userDocs.empty) {
      const userData = userDocs.docs[0].data();
      isAdmin = userData.role === 'admin' || userData.role === 'pasteur';
      isShepherd = userData.role === 'shepherd' || userData.role === 'intern';
      isADN = userData.role === 'adn';
    }

    // Check if user is a super admin
    if (!isAdmin) {
      const adminQuery = query(
        collection(db, 'admins'),
        where('uid', '==', uid),
        where('role', '==', 'super_admin')
      );
      const adminDocs = await getDocs(adminQuery);
      
      if (!adminDocs.empty) {
        isAdmin = true;
        adminRole = 'super_admin';
      }
    }

    return { isAdmin, isShepherd, isADN, adminRole: adminRole || undefined };
  } catch (error) {
    console.error('Error getting user role:', error);
    return { isAdmin: false, isShepherd: false, isADN: false };
  }
}