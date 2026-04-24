import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  query, 
  where, 
  limit,
  getDocFromServer
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

if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing. Check your .env file.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export type UserRole = 'admin' | 'staff_kitchen' | 'staff_bar' | 'staff_waiter' | 'guest';

export const getUserRole = async (uid: string, email?: string | null): Promise<UserRole> => {
  const env = (import.meta as any).env;
  const targetEmail = email || auth.currentUser?.email;
  
  if (!uid && !targetEmail) return 'guest';
  if (targetEmail === env.VITE_ADMIN_EMAIL) return 'admin';
  if (targetEmail === env.VITE_STAFF_EMAIL) return 'staff_waiter';

  try {
    // Check admins collection for assigned roles
    const adminDoc = await getDoc(doc(db, "admins", uid));
    if (adminDoc.exists()) return adminDoc.data().role as UserRole;
    
    // Check by email if UID fails
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

// Inventory Seeding Utility
export const seedInventory = async (menuData: any[]) => {
  try {
    const inventorySnap = await getDocs(collection(db, "inventory"));
    if (inventorySnap.empty) {
      const batch = writeBatch(db);
      menuData.forEach(item => {
        const docRef = doc(db, "inventory", item.id);
        batch.set(docRef, {
          ...item,
          lastRestocked: new Date(),
          soldCount: 0
        });
      });
      await batch.commit();
      console.log("Inventory seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding inventory:", err);
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const signInWithAdminCredentials = async () => {
  const env = (import.meta as any).env;
  const email = env.VITE_ADMIN_EMAIL;
  const password = env.VITE_ADMIN_PASSWORD;
  
  if (!email || !password) {
    throw new Error("Admin credentials not configured in environment.");
  }

  return loginWithEmail(email, password);
};

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or connectivity.");
    }
  }
}
testConnection();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: any[];
  }
}

export const handleFirestoreError = (error: any, operationType: any, path: string | null) => {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore error',
    operationType,
    path,
    authInfo: {
      userId: user?.uid || 'anonymous',
      email: user?.email || '',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous || true,
      providerInfo: user?.providerData || []
    }
  };
  console.error("Firestore Error:", errorInfo);
  throw new Error(JSON.stringify(errorInfo));
};
