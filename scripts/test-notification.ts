import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
};

async function testNotification() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = process.env.VITE_ADMIN_EMAIL || 'contact@tricode.pro';
  const password = process.env.VITE_ADMIN_PASSWORD;

  if (!password) {
    console.error("VITE_ADMIN_PASSWORD missing in .env");
    return;
  }

  console.log(`Authenticating as ${email}...`);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Authenticated.");

    console.log("Triggering test notification via Audit Log...");
    await addDoc(collection(db, "audits"), {
      action: "TEST_NOTIFICATION",
      details: {
        message: "Push notification test for tricode.pro",
        target: "contact@tricode.pro",
        timestamp: new Date().toISOString()
      },
      type: "staff",
      performedBy: email,
      timestamp: serverTimestamp()
    });

    // Also try to add to a notifications collection if it exists
    console.log("Adding entry to notifications collection...");
    await addDoc(collection(db, "notifications"), {
      recipient: "contact@tricode.pro",
      title: "System Test",
      body: "This is a test notification for the Brightstar Cave portal.",
      status: "pending",
      createdAt: serverTimestamp()
    });

    console.log("✅ Test notification triggered successfully!");
  } catch (error: any) {
    console.error("❌ Failed to trigger notification:", error.message);
  } finally {
    process.exit();
  }
}

testNotification();
