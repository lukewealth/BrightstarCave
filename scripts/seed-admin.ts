import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seedAdmin() {
  const email = process.env.VITE_ADMIN_EMAIL;
  const password = process.env.VITE_ADMIN_PASSWORD;
  const uid = process.env.VITE_ADMIN_UID;

  if (!email || !password || !uid) {
    console.error("Admin credentials (email, password, or uid) missing in .env");
    process.exit(1);
  }

  console.log(`Authenticating as ${email}...`);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const authedUid = userCredential.user.uid;
    
    console.log(`Authenticated successfully. Auth UID: ${authedUid}`);
    
    if (authedUid !== uid) {
      console.warn(`⚠️ Warning: Auth UID (${authedUid}) does not match VITE_ADMIN_UID (${uid})`);
    }

    console.log(`Ensuring admin document exists for UID: ${authedUid}...`);
    
    await setDoc(doc(db, 'admins', authedUid), {
      email: email,
      role: 'admin',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });

    console.log(`✅ Success: Admin document for ${email} is active.`);
  } catch (error) {
    console.error("❌ Error during admin seeding:", error);
  } finally {
    process.exit();
  }
}

seedAdmin();
