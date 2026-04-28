import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  query, 
  where, 
  limit,
  serverTimestamp,
  getDocFromServer,
  addDoc
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const rawDbId = (import.meta as any).env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
const dbId = (!rawDbId || rawDbId.includes('ai-studio-3544ee')) ? '(default)' : rawDbId;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Optimized Firestore Initialization with multi-tab persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, dbId);

export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
export const messaging = isSupported().then(yes => yes ? getMessaging(app) : null);

export const googleProvider = new GoogleAuthProvider();

export type UserRole = 'admin' | 'staff_bar' | 'staff_waiter' | 'staff' | 'guest';

/**
 * Super Admin Audit Logger
 * Tracks all stack changes, financial shifts, and inventory adjustments
 */
export const logAudit = async (action: string, details: any, category: 'sales' | 'inventory' | 'staff' | 'system' = 'system') => {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, "audits"), {
      action,
      details,
      category,
      performedBy: user?.email || 'system',
      performedByUid: user?.uid || 'system',
      timestamp: serverTimestamp(),
      severity: category === 'sales' || category === 'inventory' ? 'high' : 'medium'
    });
    
    // In a real-world scenario, this would trigger a Cloud Function to send Email/Push
    console.log(`[AUDIT] ${action}:`, details);
  } catch (err) {
    console.error("Audit logging failed:", err);
  }
};

export const requestNotificationPermission = async () => {
  try {
    const msg = await messaging;
    if (!msg) return null;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(msg, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY // Ensure this is in .env
      });
      
      if (token && auth.currentUser) {
        // Store token for super admin to receive pushes
        await setDoc(doc(db, "fcm_tokens", auth.currentUser.uid), {
          token,
          email: auth.currentUser.email,
          updatedAt: serverTimestamp()
        });
      }
      return token;
    }
  } catch (err) {
    console.error("FCM Token generation failed:", err);
  }
  return null;
};

export const getUserRole = async (uid: string, email?: string | null): Promise<UserRole> => {
  const env = (import.meta as any).env;
  const targetEmail = email || auth.currentUser?.email;
  
  if (!uid && !targetEmail) return 'guest';
  if (targetEmail === 'contact@tricode.pro' || targetEmail === env.VITE_ADMIN_EMAIL) return 'admin';
  if (targetEmail === env.VITE_STAFF_EMAIL || targetEmail === 'lukeokagha@gmail.com') return 'staff_waiter';

  try {
    const adminDoc = await getDoc(doc(db, "admins", uid));
    if (adminDoc.exists()) return adminDoc.data().role as UserRole;
    
    if (targetEmail) {
      const q = query(collection(db, "admins"), where("email", "==", targetEmail), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) return qSnap.docs[0].data().role as UserRole;
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
  }
  return 'guest';
};

// Seeding Utility for Data.json
export const seedDatabaseFromJSON = async (jsonData: any) => {
  try {
    const batch = writeBatch(db);
    const menuItems = jsonData.menu || [];
    
    // Clear existing menu for total restoration
    const currentMenu = await getDocs(collection(db, "menu"));
    currentMenu.forEach(d => batch.delete(d.ref));

    for (const item of menuItems) {
      // Restore Menu Definition
      const menuRef = doc(db, "menu", item.id);
      batch.set(menuRef, {
        ...item,
        updatedAt: serverTimestamp()
      });

      // Synchronize Inventory Baseline
      const invRef = doc(db, "inventory", item.id);
      batch.set(invRef, {
        id: item.id,
        name: item.name,
        category: item.category,
        stock: item.stock || 0,
        soldCount: 0,
        lastRestocked: serverTimestamp()
      });
    }
    
    await batch.commit();
    await logAudit("SYSTEM_RESTORE", { itemCount: menuItems.length }, 'system');
  } catch (err) {
    console.error("Master Restoration Failed:", err);
  }
};

export const getStaffList = async () => {
  const q = query(collection(db, "admins"), where("role", "in", ["staff", "staff_bar", "staff_waiter"]));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    throw error;
  }
};
