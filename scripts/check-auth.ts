import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
};

async function checkConnection() {
  console.log("--- Firebase Diagnostic ---");
  console.log(`Project ID: ${firebaseConfig.projectId}`);
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // 1. Check Firestore Connection
  try {
    console.log("Checking Firestore connectivity...");
    // Attempt to read a non-existent doc just to check connection
    await getDoc(doc(db, 'test', 'connection'));
    console.log("✅ Firestore: Connected successfully.");
  } catch (error: any) {
    console.error("❌ Firestore: Connection failed.");
    console.error(`Error: ${error.message}`);
  }

  // 2. Check Portal Login (Admin Credentials)
  const email = process.env.VITE_ADMIN_EMAIL;
  const password = process.env.VITE_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("❌ Auth: Admin credentials missing in .env");
    return;
  }

  console.log(`Attempting Portal Login for: ${email}...`);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Auth: Login successful!");
    console.log(`User UID: ${userCredential.user.uid}`);
  } catch (error: any) {
    console.error("❌ Auth: Login failed.");
    if (error.code === 'auth/operation-not-allowed') {
      console.error("Critical: Email/Password provider is DISABLED in Firebase Console.");
      console.error("Action: Enable it at Authentication > Sign-in method.");
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      console.error("Error: Invalid email or password. Ensure the user exists in Firebase Auth.");
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

checkConnection().then(() => process.exit());
