import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error("VITE_FIREBASE_PROJECT_ID missing in .env");
  process.exit(1);
}

initializeApp({
  projectId: projectId
});

const db = getFirestore();

async function addAdmin() {
  const email = 'contact@tricode.pro';
  try {
    console.log(`Adding ${email} as admin...`);
    const adminRef = db.collection('admins').doc(); // Auto-ID or we could use email as ID if we want to be sure
    
    // Check if exists first
    const snapshot = await db.collection('admins').where('email', '==', email).get();
    if (snapshot.empty) {
      await db.collection('admins').add({
        email: email,
        role: 'admin',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`Admin ${email} added successfully.`);
    } else {
      console.log(`Admin ${email} already exists.`);
    }
  } catch (error) {
    console.error("Error adding admin:", error);
  } finally {
    process.exit();
  }
}

addAdmin();
