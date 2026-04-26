import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  projectId: "brightstart-6afcd", // Hardcoded project ID from firebase.json
  appId: "1:931201550937:web:2a3036e5229c1598007624",
  apiKey: "...", // Not strictly needed for Firestore in local admin context with some configs, but usually required
  authDomain: "brightstart-6afcd.firebaseapp.com",
};

// Re-using the config from the env if possible
import * as dotenv from 'dotenv';
dotenv.config();

const config = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
};

const app = initializeApp(config);
const db = getFirestore(app);

async function seed() {
  try {
    const dataPath = path.join(process.cwd(), 'src/data/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log("Seeding menu and inventory...");
    const batch = writeBatch(db);
    
    for (const item of data.menu) {
      const menuRef = doc(db, 'menu', item.id);
      batch.set(menuRef, {
        ...item,
        updatedAt: serverTimestamp()
      });

      const invRef = doc(db, 'inventory', item.id);
      batch.set(invRef, {
        name: item.name,
        price: item.price,
        type: item.type,
        stock: item.stock,
        category: item.category,
        lastRestocked: serverTimestamp(),
        soldCount: 0
      });
    }

    await batch.commit();
    console.log("Seeding complete via Batch!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    process.exit();
  }
}

seed();
