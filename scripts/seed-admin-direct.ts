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
  const email = 'brightstarcave@gmail.com';
  const uid = 'BuOpCimRjSb297fNxOVRY484K5E2';
  
  try {
    console.log(`Ensuring ${email} (UID: ${uid}) is a Super Admin...`);
    
    // We use the UID as the Document ID to match the Firestore rules:
    // exists(/databases/$(database)/documents/admins/$(request.auth.uid))
    const adminRef = db.collection('admins').doc(uid);
    
    await adminRef.set({
      email: email,
      role: 'admin',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Success: Admin document created/updated for ${email}`);
    
  } catch (error) {
    console.error("❌ Error adding admin:", error);
  } finally {
    process.exit();
  }
}

addAdmin();
